import json
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Generic, NewType, Protocol, Type, TypeVar

import lastmile_utils.lib.core.api as core_utils
import result
from aiconfig.eval import common
from pydantic import BaseModel
from result import Result

T_InputDatum = TypeVar("T_InputDatum", contravariant=True)
T_OutputDatum = TypeVar("T_OutputDatum", contravariant=True)

T_Evaluable = TypeVar("T_Evaluable", contravariant=True)

T_BaseModel = TypeVar("T_BaseModel", bound=BaseModel)

SerializedJSON = NewType("SerializedJSON", str)


@dataclass(frozen=True)
class CustomMetricValue(ABC):
    """
    Subclass this if you want your metric to return a type not listed below
    (See the definition of T_MetricValue).
    See `metrics.py:TextSentimentScores` and `metrics.py:nltk_sentiment_scores_vader for an example.

    A subclass (an implementation of CustomMetricValue) can either be ordered or unordered.
    If ordered, it must implement the comparison operators <, <=, >, and >=.
    See TextOverallPositiveSentiment for example.
    See EvaluationMetricMetadata for more information about ordered metrics.
    """


T_MetricValue = TypeVar("T_MetricValue", int, float, str, bool, CustomMetricValue, covariant=True)


class CompletionTextToSerializedJSON(Protocol):
    @abstractmethod
    def __call__(self, output_datum: str) -> Result[common.SerializedJSON, str]:
        pass


@dataclass(frozen=True)
class CustomMetricPydanticObject(CustomMetricValue, Generic[T_BaseModel]):
    data: T_BaseModel


class EvaluationFunction(Protocol, Generic[T_Evaluable, T_MetricValue]):
    @abstractmethod
    async def __call__(self, datum: T_Evaluable) -> T_MetricValue:
        pass


class EvaluationMetricMetadata(core_utils.Record, Generic[T_Evaluable, T_MetricValue]):

    """A record to tie together metadata about an evaluation metric
    to ensure that numbers are interpreted as intended.


    Assumptions:
    * If the best and worst values are not None, then the metric is assumed to be ordered.
      In this case (if the metric is ordered) then the comparison operators <, <=, >, and >=
      must be implemented (see CustomMetricValue).
      If a metric is ordered, the domain is assumed to be a single closed interval or fully-ordered discrete set
      with one endpoint being the best possible value and
      the opposite endpoint the worst possible value.
    * Furthermore, if a metric is ordered, it is implicitly associated with a monotonic function of "goodness".
      That is, the metric either gets better along the entire domain, or worse along the entire domain.
      There are two cases: higher-is-better and lower-is-better.
    Examples:
        - Accuracy (higher-is-better): range = 0 -> 1. Worst score is 0, best is 1.
        0.1 is better than 0, 0.2 is better than 0.1, etc.
          Accuracy must fall between 0 and 1.
        - Error count (lower-is-better): range = 0 -> inf. Best score is 0, worst is inf.
        2 is worse than 1, 3 is worse than 2, etc.
          Error count must fall between 0 and inf.
    """

    @property
    def id(self) -> str:
        return core_utils.hash_id(
            f"{self.name}{self.description}{self.best_value}{self.worst_value}params={self._serialize_extra_metadata()}".encode("utf-8")
        )

    def _serialize_extra_metadata(self) -> str:
        return json.dumps(self.extra_metadata, sort_keys=True)

    name: str
    description: str
    best_value: T_MetricValue | None = None
    worst_value: T_MetricValue | None = None
    # e.g. {"substring": "hello", "case_sensitive": False}
    extra_metadata: dict[str, Any] = {}

    def __repr__(self) -> str:
        fields = self.__dict__
        fields["id"] = self.id
        s_json = json.dumps(fields, indent=2)
        return f"EvaluationMetricMetadata({s_json})"


@dataclass(frozen=True)
class SampleMetricValue(Generic[T_Evaluable, T_MetricValue]):
    # `None` is used to signal that there was an error during calculation.
    # In this case, error information is written to stderr (see lib.py:_evaluate_for_sample()).
    value: T_MetricValue | None
    metric_metadata: EvaluationMetricMetadata[T_Evaluable, T_MetricValue]

    def __post_init__(self) -> None:
        metric_metadata = self.metric_metadata
        worst_value, best_value = (
            metric_metadata.worst_value,
            metric_metadata.best_value,
        )
        value = self.value
        if worst_value is None and best_value is None:
            # fine
            return
        elif worst_value is None or best_value is None:
            raise ValueError(
                f"""
                    [{metric_metadata.name}]
                    {metric_metadata.description}

                    You must define both worst_value and best_value, or neither.
                    You defined worst_value = {worst_value} and best_value = {best_value}.
                """
            )
        elif worst_value == best_value:
            raise ValueError("best_value and worst_value cannot be equal")
        elif value is not None and worst_value < best_value and not worst_value <= value <= best_value:  # type: ignore[fixme]
            raise ValueError(
                f"""
                    [{metric_metadata.name}]
                    {metric_metadata.description}

                    Value {value} is not in range [{worst_value}, {best_value}]. 
                    You defined worst_value = {worst_value} and best_value = {best_value},
                    but got value outside that range.
                """
            )
        elif value is not None and worst_value > best_value and not worst_value >= value >= best_value:  # type: ignore[fixme]
            raise ValueError(
                f"""
                    [{metric_metadata.name}]
                    {metric_metadata.description}

                    Value {value} is not in range [{worst_value}, {best_value}]. 
                    You defined worst_value = {worst_value} and best_value = {best_value},
                    but got value outside that range.
                """
            )


class TextRatingsData(core_utils.Record):
    conciseness_rating: int
    conciseness_confidence: float
    conciseness_reasoning: str


def get_llm_structured_response(
    input_text: str,
    chat_completion_create: CompletionTextToSerializedJSON,
    basemodel_type: Type[common.T_BaseModel],
) -> Result[common.T_BaseModel, str]:
    return result.do(
        core_utils.safe_model_validate_json(response_ok, basemodel_type)
        # get the serialized JSON response
        for response_ok in chat_completion_create(input_text)
    )
