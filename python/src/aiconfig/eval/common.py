from typing import Any, Generic
from abc import abstractmethod
from typing import Any, Generic, Protocol, TypeVar

import lastmile_utils.lib.core.api as cu
from pydantic import root_validator


T_InputDatum = TypeVar("T_InputDatum", contravariant=True)
T_OutputDatum = TypeVar("T_OutputDatum", contravariant=True)


class EvaluationMetricMetadata(cu.Record, Generic[T_OutputDatum]):
    """A record to tie together metadata about an evaluation metric
    to ensure that numbers are interpreted as intended.

    Assumptions:
    * Metric type is float
        (bools and ints have to be represented as floats; tensors are not supported)
    * Range is a single interval with one endpoint being the best possible value
      and the opposite endpoint the worst possible value.
    * The metric either gets better or worse along the entire range.
      There are two cases: higher-is-better and lower-is-better.
    Examples:
        - Accuracy (higher-is-better): range = 0 -> 1. Worst score is 0, best is 1.
        0.1 is better than 0, 0.2 is better than 0.1, etc.
          Accuracy must fall between 0 and 1.
        - Error count (lower-is-better): range = 0 -> inf. Best score is 0, worst is inf.
        2 is worse than 1, 3 is worse than 2, etc.
          Error count must fall between 0 and inf.
    """

    name: str
    description: str
    best_value: float
    worst_value: float


class SampleMetricValue(cu.Record, Generic[T_OutputDatum]):
    value: float
    interpretation: EvaluationMetricMetadata[T_OutputDatum]

    @root_validator(pre=True)
    def check_value_range(cls, values: dict[str, Any]) -> dict[str, Any]:
        worst_value, best_value = (
            values["interpretation"].worst_value,
            values["interpretation"].best_value,
        )
        value = values["value"]
        if worst_value == best_value:
            raise ValueError("best_value and worst_value cannot be equal")
        if worst_value < best_value and not worst_value <= value <= best_value:
            raise ValueError(
                f"""
                    Value {value} is not in range [{worst_value}, {best_value}]. 
                    You defined worst_value = {worst_value} and best_value = {best_value},
                    but got value outside that range.
                """
            )
        if worst_value > best_value and not worst_value >= value >= best_value:
            raise ValueError(
                f"""
                    Value {value} is not in range [{worst_value}, {best_value}]. 
                    You defined worst_value = {worst_value} and best_value = {best_value},
                    but got value outside that range.
                """
            )

        return values


class SampleEvaluationFunction(Protocol, Generic[T_OutputDatum]):
    @abstractmethod
    def __call__(self, output_datum: T_OutputDatum) -> SampleMetricValue[T_OutputDatum]:
        pass
