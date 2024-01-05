import json
import sys
from abc import abstractmethod
from dataclasses import dataclass
from functools import partial, total_ordering
from typing import Any, Callable, Generic, Protocol, Type

import lastmile_utils.lib.core.api as core_utils
import nltk
import pandas as pd
from aiconfig.eval import common
from aiconfig.eval.openai import OpenAIChatCompletionCreate, default_openai_chat_completion_create, make_fn_completion_text_to_serialized_json
from nltk.sentiment.vader import SentimentIntensityAnalyzer as NLTKSentimentIntensityAnalyzer
from result import Err, Ok, Result


@dataclass(frozen=True)
class Metric(Generic[common.T_Evaluable, common.T_MetricValue]):
    """See metrics.py for examples."""

    evaluation_fn: common.EvaluationFunction[common.T_Evaluable, common.T_MetricValue]
    metric_metadata: common.EvaluationMetricMetadata[common.T_Evaluable, common.T_MetricValue]

    async def __call__(self, datum: common.T_Evaluable) -> common.T_MetricValue:
        """
        For convenience, make a Metric callable.
        Similar to torch Module `forward()`.
        """
        return await self.evaluation_fn(datum)


def _check_substring(
    output_datum: str,
    substring: str,
    #
    case_sensitive: bool,
) -> bool:
    if case_sensitive:
        return substring in output_datum
    else:
        return substring.lower() in output_datum.lower()


async def _calculate_brevity(datum: str) -> int:
    if len(datum) == 0:
        raise ValueError("Brevity is meaningless for empty string.")
    return len(datum)


@dataclass(frozen=True)
class TextSentimentScores(common.CustomMetricValue):
    mapping: dict[str, float]
    pos: float
    neg: float
    neu: float
    compound: float
    highest: str


@total_ordering
@dataclass(frozen=True, eq=False)
class TextOverallPositiveSentiment(common.CustomMetricValue):
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


class GetPolarityScores(Protocol):
    @abstractmethod
    def __call__(self, text: str) -> dict[str, float]:
        pass


def _get_nltk_polarity_scores(text: str, model: str) -> dict[str, float]:
    nltk.download(model, quiet=True)  # type: ignore
    return NLTKSentimentIntensityAnalyzer().polarity_scores(text)  # type: ignore


def _get_sentiment_scores(output_datum: str, get_polarity_scores: GetPolarityScores) -> TextSentimentScores:
    mapping: dict[str, float] = get_polarity_scores(output_datum)
    highest: str = pd.Series(mapping).idxmax()  # type: ignore
    return TextSentimentScores(mapping=mapping, **mapping, highest=highest)


def make_get_sentiment_scores(get_polarity_scores: GetPolarityScores) -> common.EvaluationFunction[str, TextSentimentScores]:
    async def _f(datum: str) -> TextSentimentScores:
        return _get_sentiment_scores(datum, get_polarity_scores)

    return _f


def make_get_sentiment_class(get_polarity_scores: GetPolarityScores) -> common.EvaluationFunction[str, str]:
    async def _f(datum: str) -> str:
        scores = _get_sentiment_scores(datum, get_polarity_scores)
        return scores.highest

    return _f


def make_get_overall_positive_sentiment(get_polarity_scores: GetPolarityScores) -> common.EvaluationFunction[str, TextOverallPositiveSentiment]:
    async def _f(datum: str) -> TextOverallPositiveSentiment:
        scores = _get_sentiment_scores(datum, get_polarity_scores)
        return TextOverallPositiveSentiment(pos=scores.pos, neg=scores.neg)

    return _f


def make_sentiment_scores_metric(
    get_polarity_scores: GetPolarityScores,
    make_evaluation_fn: Callable[[GetPolarityScores], common.EvaluationFunction[str, common.T_MetricValue]],
    name: str,
    description: str,
    best_value: common.T_MetricValue | None = None,
    worst_value: common.T_MetricValue | None = None,
) -> Metric[str, common.T_MetricValue]:
    evaluation_fn: common.EvaluationFunction[str, common.T_MetricValue] = make_evaluation_fn(get_polarity_scores)
    out: Metric[str, common.T_MetricValue] = Metric(
        evaluation_fn=evaluation_fn,
        metric_metadata=common.EvaluationMetricMetadata(
            #
            name=name,
            description=description,
            #
            best_value=best_value,
            worst_value=worst_value,
        ),
    )
    return out


def make_structured_llm_metric(
    chat_completion_create: common.CompletionTextToSerializedJSON,
    eval_llm_name: str,
    pydantic_basemodel_type: Type[common.T_BaseModel],
    metric_name: str,
    metric_description: str,
    field_descriptions: dict[str, str] = {},
) -> Metric[str, common.CustomMetricPydanticObject[common.T_BaseModel]]:
    def _make_evaluation_fn(
        basemodel_type: Type[common.T_BaseModel],
    ) -> common.EvaluationFunction[str, common.CustomMetricPydanticObject[common.T_BaseModel]]:
        async def _evaluation_fn(datum: str) -> common.CustomMetricPydanticObject[common.T_BaseModel]:
            resp = common.get_llm_structured_response(
                input_text=datum,
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
        metric_metadata=common.EvaluationMetricMetadata(
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
    pydantic_basemodel_type: Type[common.T_BaseModel],
    metric_name: str,
    metric_description: str,
    field_descriptions: dict[str, str],
    openai_chat_completion_create: OpenAIChatCompletionCreate | None = None,
) -> Result[Metric[str, common.CustomMetricPydanticObject[common.T_BaseModel]], str]:
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
            return core_utils.dict_union_allow_replace(value, {"description": field_descriptions[key]})
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


## User interface


# 1. functions that return metrics intended to be called directly


def make_openai_structured_llm_metric(
    eval_llm_name: str,
    pydantic_basemodel_type: Type[common.T_BaseModel],
    metric_name: str,
    metric_description: str,
    field_descriptions: dict[str, str] = {},
    openai_chat_completion_create: OpenAIChatCompletionCreate | None = None,
) -> Metric[str, common.CustomMetricPydanticObject[common.T_BaseModel]]:
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


def substring_match(substring: str, case_sensitive: bool = True) -> Metric[str, bool]:
    async def _fn(datum: str) -> bool:
        return _check_substring(
            output_datum=datum,
            substring=substring,
            case_sensitive=case_sensitive,
        )

    return Metric(
        evaluation_fn=_fn,
        metric_metadata=common.EvaluationMetricMetadata(
            name="substring_match",
            description="True (pass) if contains given substring",
            best_value=True,
            worst_value=False,
            extra_metadata=dict(substring=substring, case_sensitive=case_sensitive),
        ),
    )


# 2. literal metrics

brevity: Metric[str, int] = Metric(
    evaluation_fn=_calculate_brevity,
    metric_metadata=common.EvaluationMetricMetadata(
        name="brevity",
        description="Absolute text length",
        best_value=1,
        worst_value=sys.maxsize,
    ),
)


gpt3_5_text_ratings = make_openai_structured_llm_metric(
    eval_llm_name="gpt-3.5-turbo-0613",
    pydantic_basemodel_type=common.TextRatingsData,
    metric_name="text_ratings",
    metric_description="Text ratings",
    field_descriptions=dict(
        conciseness_rating="1 to 5 rating of conciseness",
        conciseness_confidence="0 to 1.0 rating of confidence in conciseness rating",
        conciseness_reasoning="reasoning behind the conciseness rating",
    ),
)

nltk_sentiment_scores_vader = make_sentiment_scores_metric(
    get_polarity_scores=partial(_get_nltk_polarity_scores, model="vader_lexicon"),
    make_evaluation_fn=make_get_sentiment_scores,
    name="nltk_sentiment_scores_vader",
    description="NLTK sentiment scores using Vader",
)

nltk_sentiment_class_vader = make_sentiment_scores_metric(
    get_polarity_scores=partial(_get_nltk_polarity_scores, model="vader_lexicon"),
    make_evaluation_fn=make_get_sentiment_class,
    name="nltk_sentiment_class_vader",
    description="Highest-probability NLTK sentiment class using Vader",
)

nltk_sentiment_score_overall_positive = make_sentiment_scores_metric(
    get_polarity_scores=partial(_get_nltk_polarity_scores, model="vader_lexicon"),
    make_evaluation_fn=make_get_overall_positive_sentiment,
    name="nltk_sentiment_score_overall_positive",
    description="Positive minus negative",
    best_value=TextOverallPositiveSentiment(pos=1.0, neg=0.0),
    worst_value=TextOverallPositiveSentiment(pos=0.0, neg=1.0),
)
