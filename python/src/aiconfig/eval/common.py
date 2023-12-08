import json
from typing import Any, Generic
from abc import abstractmethod
from typing import Any, Generic, Protocol, TypeVar

import lastmile_utils.lib.core.api as cu
from pydantic import root_validator


T_InputDatum = TypeVar("T_InputDatum", contravariant=True)
T_OutputDatum = TypeVar("T_OutputDatum", contravariant=True)


class SampleEvaluationFunction(Protocol, Generic[T_OutputDatum]):
    @abstractmethod
    def __call__(self, output_datum: T_OutputDatum) -> float:
        pass


class EvaluationMetricMetadata(cu.Record, Generic[T_OutputDatum]):
    """A record to tie together metadata about an evaluation metric
    to ensure that numbers are interpreted as intended.

    IMPORTANT NOTE:
        **This property is part of the contract of implementing a metric**:

        `id` must uniquely identify the metric to disambiguate different
          conceptual quantities in case they happen to share a name.

          If you write a metric, to write an automated test for this property,
          see `test_metric_library_id_properties()`.

          Illustration of the property:
            ```
                # Helper function
                def extract_id(matcher, matcher_input):
                    return matcher(matcher_input).metric_metadata.id

                # These two metrics share everything but the substring.
                matcher1 = substring_match("hello")
                matcher2 = substring_match("world")

                # Run both on the same input.
                the_input = "hello world"

                # They have distinct IDs because of the two different substrings.
                assert extract_id(matcher1, the_input) != extract_id(matcher2, the_input)
             ```


        `id` must however be a _constant_ with respect to the metric input.
            Illustration of the property:

            ```
                the_matcher = substring_match("hello")
                input1 = "hello world"
                input2 = "the quick brown fox"

                assert extract_id(the_matcher, input1) == extract_id(the_matcher, input2)
            ```

          See `metrics.substring_match()` for an example of how to set an id.



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
    best_value: float
    worst_value: float
    # e.g. {"substring": "hello", "case_sensitive": False}
    extra_metadata: dict[str, Any] = {}



class SampleMetricValue(cu.Record, Generic[T_OutputDatum]):
    value: float
    metric_metadata: EvaluationMetricMetadata[T_OutputDatum]

    @root_validator(pre=True)
    def check_value_range(cls, values: dict[str, Any]) -> dict[str, Any]:
        worst_value, best_value = (
            values["metric_metadata"].worst_value,
            values["metric_metadata"].best_value,
        )
        value = values["value"]
        if worst_value == best_value:
            raise ValueError("best_value and worst_value cannot be equal")
        if worst_value < best_value and not worst_value <= value <= best_value:
            raise ValueError(
                f"""
                    [{values["metric_metadata"].name}]
                    {values["metric_metadata"].description}

                    Value {value} is not in range [{worst_value}, {best_value}]. 
                    You defined worst_value = {worst_value} and best_value = {best_value},
                    but got value outside that range.
                """
            )
        if worst_value > best_value and not worst_value >= value >= best_value:
            raise ValueError(
                f"""
                    [{values["metric_metadata"].name}]
                    {values["metric_metadata"].description}

                    Value {value} is not in range [{worst_value}, {best_value}]. 
                    You defined worst_value = {worst_value} and best_value = {best_value},
                    but got value outside that range.
                """
            )

        return values
