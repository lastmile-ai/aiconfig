from dataclasses import dataclass
import json
from typing import Any, Generic
from abc import ABC, abstractmethod
from typing import Any, Generic, Protocol, TypeVar

import lastmile_utils.lib.core.api as cu
from pydantic import root_validator


T_InputDatum = TypeVar("T_InputDatum", contravariant=True)
T_OutputDatum = TypeVar("T_OutputDatum", contravariant=True)


@dataclass
class CustomMetricValue(ABC):
    """Subclass this if you want your metric to return a type not included in MetricValue."""

    pass


MetricValue = int | float | str | bool | CustomMetricValue


class EvaluationFunction(Protocol, Generic[T_OutputDatum]):
    @abstractmethod
    def __call__(self, output_datum: T_OutputDatum) -> MetricValue:
        pass


class EvaluationMetricMetadata(cu.Record, Generic[T_OutputDatum]):
    """A record to tie together metadata about an evaluation metric
    to ensure that numbers are interpreted as intended.


    Assumptions:
    * If the best and worst values are not None, then the metric is considered ordered.
      In this case, the domain is a single closed interval or fully-ordered discrete set
      with one endpoint being the best possible value and
      the opposite endpoint the worst possible value.
    * The metric is a monotonic one-to-one function of "goodness". That is, 
      the metric either gets better or worse along the entire range.
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
        return cu.hash_id(
            f"{self.name}{self.description}{self.best_value}{self.worst_value}params={self._serialize_extra_metadata()}".encode(
                "utf-8"
            )
        )

    def _serialize_extra_metadata(self) -> str:
        return json.dumps(self.extra_metadata, sort_keys=True)

    name: str
    description: str
    best_value: MetricValue | None
    worst_value: MetricValue | None
    # e.g. {"substring": "hello", "case_sensitive": False}
    extra_metadata: dict[str, Any] = {}


class SampleMetricValue(cu.Record, Generic[T_OutputDatum]):
    value: MetricValue
    metric_metadata: EvaluationMetricMetadata[T_OutputDatum]

    @root_validator(pre=True)
    def check_value_range(cls, values: dict[str, Any]) -> dict[str, Any]:
        worst_value, best_value = (
            values["metric_metadata"].worst_value,
            values["metric_metadata"].best_value,
        )
        value = values["value"]
        if worst_value is None and best_value is None:
            # fine
            return values
        elif worst_value is None or best_value is None:
            raise ValueError(
                f"""
                    [{values["metric_metadata"].name}]
                    {values["metric_metadata"].description}

                    You must define both worst_value and best_value, or neither.
                    You defined worst_value = {worst_value} and best_value = {best_value}.
                """
            )
        elif worst_value == best_value:
            raise ValueError("best_value and worst_value cannot be equal")
        elif worst_value < best_value and not worst_value <= value <= best_value:
            raise ValueError(
                f"""
                    [{values["metric_metadata"].name}]
                    {values["metric_metadata"].description}

                    Value {value} is not in range [{worst_value}, {best_value}]. 
                    You defined worst_value = {worst_value} and best_value = {best_value},
                    but got value outside that range.
                """
            )
        elif worst_value > best_value and not worst_value >= value >= best_value:
            raise ValueError(
                f"""
                    [{values["metric_metadata"].name}]
                    {values["metric_metadata"].description}

                    Value {value} is not in range [{worst_value}, {best_value}]. 
                    You defined worst_value = {worst_value} and best_value = {best_value},
                    but got value outside that range.
                """
            )
        else:
            return values
