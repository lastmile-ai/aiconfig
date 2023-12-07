
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
    * Value is monotonic in "goodness". i.e. there are two cases:
        higher is better
            e.g. accuracy, best_value=1.0, worst_value=0.0
            The higher the better over the entire range.
        lower is better
            e.g. error count, best_value=0.0, worst_value=inf
            The lower the better over the entire rane.
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
        wv, bv = (
            values["interpretation"].worst_value,
            values["interpretation"].best_value,
        )
        value = values["value"]
        if wv == bv:
            raise ValueError("best_value and worst_value cannot be equal")
        if wv < bv and not wv <= value <= bv:
            raise ValueError(f"value {value} is not in range [{wv}, {bv}] (inclusive)")
        if wv > bv and not wv >= value >= bv:
            raise ValueError(f"value {value} is not in range [{bv}, {wv}] (inclusive)")

        return values


class SampleEvaluationFunction(Protocol, Generic[T_OutputDatum]):
    @abstractmethod
    def __call__(self, output_datum: T_OutputDatum) -> SampleMetricValue[T_OutputDatum]:
        pass