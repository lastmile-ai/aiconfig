import json
from functools import total_ordering
from typing import Any, Generic, Type

import lastmile_utils.lib.core.api as cu
import nltk
import pandas as pd
from aiconfig.eval import common
from aiconfig.eval.common import CustomMetricValue, EvaluationFunction, EvaluationMetricMetadata, T_BaseModel, T_OutputDatum, TextRatingsData
from aiconfig.eval.openai import OpenAIChatCompletionCreate, default_openai_chat_completion_create, make_fn_completion_text_to_serialized_json
from attr import dataclass
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from result import Err, Ok, Result


@dataclass(frozen=True)
class Metric(Generic[T_OutputDatum]):
    """See metrics.py for examples."""

    evaluation_fn: EvaluationFunction[T_OutputDatum]
    metric_metadata: EvaluationMetricMetadata[T_OutputDatum]

    async def __call__(self, output_datum: T_OutputDatum) -> Any:
        """
        For convenience, make a Metric callable.
        Similar to torch Module `forward()`.
        """
        return await self.evaluation_fn(output_datum)


def _check_substring(output_datum: str, substring: str, case_sensitive: bool) -> bool:
    if case_sensitive:
        return substring in output_datum
    else:
        return substring.lower() in output_datum.lower()


def substring_match(substring: str, case_sensitive: bool = True) -> Metric[str]:
    async def _fn(output_datum: str) -> bool:
        return _check_substring(
            output_datum=output_datum,
            substring=substring,
            case_sensitive=case_sensitive,
        )

    return Metric(
        evaluation_fn=_fn,
        metric_metadata=EvaluationMetricMetadata(
            name="substring_match",
            description="True (pass) if contains given substring",
            best_value=True,
            worst_value=False,
            extra_metadata=dict(substring=substring, case_sensitive=case_sensitive),
        ),
    )


async def _calculate_brevity(output_datum: str) -> int:
    if len(output_datum) == 0:
        raise ValueError("Brevity is meaningless for empty string.")
    return len(output_datum)


brevity: Metric[str] = Metric(
    evaluation_fn=_calculate_brevity,
    metric_metadata=EvaluationMetricMetadata(
        name="brevity",
        description="Absolute text length",
        best_value=1.0,
        worst_value=float("inf"),
    ),
)


@dataclass
class TextSentimentScores(CustomMetricValue):
    mapping: dict[str, float]
    pos: float
    neg: float
    neu: float
    compound: float
    highest: str


@total_ordering
@dataclass(eq=False)
class TextOverallPositiveSentiment(CustomMetricValue):
    """Compare by total positive sentiment: positive - negative"""

    pos: float
    neg: float

    def __eq__(self, other: Any) -> bool:
        """Overrides the default implementation"""
        return isinstance(other, TextOverallPositiveSentiment) and (
            self.pos,
            self.neg,
        ) == (other.pos, other.neg)

    def __lt__(self, other: Any) -> bool:
        if not isinstance(other, TextOverallPositiveSentiment):
            raise TypeError(f"Cannot compare TextPositiveSentimentScores with {type(other)}")
        return self.pos - self.neg < other.pos - other.neg


async def _get_sentiment_scores(output_datum: str) -> TextSentimentScores:
    nltk.download("vader_lexicon", quiet=True)  # type: ignore
    sid = SentimentIntensityAnalyzer()
    mapping: dict[str, float] = sid.polarity_scores(output_datum)  # type: ignore
    highest: str = pd.Series(mapping).idxmax()  # type: ignore
    return TextSentimentScores(mapping=mapping, **mapping, highest=highest)


async def _get_sentiment(output_datum: str) -> str:
    scores = await _get_sentiment_scores(output_datum)
    return scores.highest


async def _get_overall_positive_sentiment(output_datum: str) -> TextOverallPositiveSentiment:
    scores = await _get_sentiment_scores(output_datum)
    return TextOverallPositiveSentiment(pos=scores.pos, neg=scores.neg)


sentiment_scores: Metric[str] = Metric(
    evaluation_fn=_get_sentiment_scores,
    metric_metadata=EvaluationMetricMetadata(
        name="sentiment_scores",
        description="Sentiment scores container object",
        best_value=None,
        worst_value=None,
    ),
)


sentiment_class: Metric[str] = Metric(
    evaluation_fn=_get_sentiment,
    metric_metadata=EvaluationMetricMetadata(
        name="sentiment_class",
        description="top sentiment class",
        best_value=None,
        worst_value=None,
    ),
)


sentiment_score_overall_positive: Metric[str] = Metric(
    evaluation_fn=_get_overall_positive_sentiment,
    metric_metadata=EvaluationMetricMetadata(
        name="sentiment_score_overall_positive",
        description="Positive minus negative",
        best_value=TextOverallPositiveSentiment(pos=1.0, neg=0.0),
        worst_value=TextOverallPositiveSentiment(pos=0.0, neg=1.0),
    ),
)


def make_structured_llm_metric(
    chat_completion_create: common.CompletionTextToSerializedJSON,
    eval_llm_name: str,
    pydantic_basemodel_type: Type[T_BaseModel],
    metric_name: str,
    metric_description: str,
    field_descriptions: dict[str, str] = {},
) -> Metric[str]:
    def _make_evaluation_fn(basemodel_type: Type[T_BaseModel]) -> EvaluationFunction[str]:
        async def _evaluation_fn(output_datum: str) -> common.CustomMetricPydanticObject[T_BaseModel]:
            resp = common.get_llm_structured_response(
                input_text=output_datum,
                chat_completion_create=chat_completion_create,
                basemodel_type=basemodel_type,
            )

            # Intentional: unwrap and raise here to conform to the Metric interface.
            match resp:
                case Err(e):
                    raise ValueError(f"Error getting structured response: {e}")
                case Ok(data):
                    return common.CustomMetricPydanticObject(data=data)

        return _evaluation_fn

    return Metric(
        evaluation_fn=_make_evaluation_fn(pydantic_basemodel_type),
        metric_metadata=EvaluationMetricMetadata(
            name=metric_name,
            description=metric_description,
            extra_metadata=dict(
                basemodel_type_name=pydantic_basemodel_type.__name__,
                eval_llm_name=eval_llm_name,
                field_descriptions_json=json.dumps(field_descriptions, sort_keys=True),
            ),
        ),
    )


def _make_openai_structured_llm_metric_helper(
    eval_llm_name: str,
    pydantic_basemodel_type: Type[T_BaseModel],
    metric_name: str,
    metric_description: str,
    field_descriptions: dict[str, str],
    openai_chat_completion_create: OpenAIChatCompletionCreate | None = None,
) -> Result[Metric[str], str]:
    schema = pydantic_basemodel_type.model_json_schema()
    properties = schema["properties"]
    required = schema["required"]

    if not field_descriptions.keys() <= properties.keys():
        return Err(
            f"""
                The following field_descriptions keys are not in the schema:
                {set(field_descriptions.keys()) - set(properties.keys())}
            """
        )

    def _with_description(key: str, value: dict[str, str]) -> dict[str, str]:
        if key in field_descriptions:
            return cu.dict_union_allow_replace(value, {"description": field_descriptions[key]})
        return value

    properties = {k: _with_description(k, v) for k, v in properties.items()}

    required = required or list(properties.keys())

    openai_eval_llm_chat_completion_create: common.CompletionTextToSerializedJSON = make_fn_completion_text_to_serialized_json(
        eval_llm_name=eval_llm_name,
        properties=properties,
        required=required,
        openai_chat_completion_create=(openai_chat_completion_create or default_openai_chat_completion_create),
    )

    return Ok(
        make_structured_llm_metric(
            openai_eval_llm_chat_completion_create,
            eval_llm_name=eval_llm_name,
            pydantic_basemodel_type=pydantic_basemodel_type,
            metric_name=metric_name,
            metric_description=metric_description,
            field_descriptions=field_descriptions,
        )
    )


def make_openai_structured_llm_metric(
    eval_llm_name: str,
    pydantic_basemodel_type: Type[T_BaseModel],
    metric_name: str,
    metric_description: str,
    field_descriptions: dict[str, str] = {},
    openai_chat_completion_create: OpenAIChatCompletionCreate | None = None,
) -> Metric[str]:
    res_metric = _make_openai_structured_llm_metric_helper(
        eval_llm_name=eval_llm_name,
        pydantic_basemodel_type=pydantic_basemodel_type,
        metric_name=metric_name,
        metric_description=metric_description,
        field_descriptions=field_descriptions,
        openai_chat_completion_create=openai_chat_completion_create,
    )

    # User interface: unwrap and raise
    match res_metric:
        case Ok(metric):
            return metric
        case Err(e):
            raise ValueError(f"Error making metric: {e}")


gpt3_5_text_ratings = make_openai_structured_llm_metric(
    eval_llm_name="gpt-3.5-turbo-0613",
    pydantic_basemodel_type=TextRatingsData,
    metric_name="text_ratings",
    metric_description="Text ratings",
    field_descriptions=dict(
        conciseness_rating="1 to 5 rating of conciseness",
        conciseness_confidence="0 to 1.0 rating of confidence in conciseness rating",
        conciseness_reasoning="reasoning behind the conciseness rating",
    ),
)
