from abc import abstractmethod
from dataclasses import dataclass
from typing import Generic, NewType, Protocol, Type, TypeVar

import lastmile_utils.lib.core.api as core_utils
import result
from pydantic import BaseModel
from result import Result

from aiconfig.eval import common


T_BaseModel = TypeVar("T_BaseModel", bound=BaseModel)

SerializedJSON = NewType("SerializedJSON", str)


class CompletionTextToSerializedJSON(Protocol):
    @abstractmethod
    def __call__(self, output_datum: str) -> Result[SerializedJSON, str]:
        pass


@dataclass(frozen=True)
class CustomMetricPydanticObject(common.CustomMetricValue, Generic[T_BaseModel]):
    data: T_BaseModel


class EvaluationFunction(Protocol, Generic[common.T_Evaluable, common.T_MetricValue]):
    @abstractmethod
    async def __call__(self, datum: common.T_Evaluable) -> common.T_MetricValue:
        pass


@dataclass(frozen=True)
class SampleMetricValue(Generic[common.T_Evaluable, common.T_MetricValue]):
    # `None` is used to signal that there was an error during calculation.
    # In this case, error information is written to stderr (see lib.py:_evaluate_for_sample()).
    value: common.T_MetricValue | None
    metric_metadata: common.EvaluationMetricMetadata[common.T_Evaluable, common.T_MetricValue]

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
    basemodel_type: Type[T_BaseModel],
) -> Result[T_BaseModel, str]:
    return result.do(
        core_utils.safe_model_validate_json(response_ok, basemodel_type)
        # get the serialized JSON response
        for response_ok in chat_completion_create(input_text)
    )

