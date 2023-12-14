from typing import Any, Generic

from attr import dataclass
from aiconfig.eval.common import (
    EvaluationMetricMetadata,
    EvaluationFunction,
    T_OutputDatum,
)


@dataclass(frozen=True)
class Metric(Generic[T_OutputDatum]):
    """See metrics.py for examples."""

    evaluation_fn: EvaluationFunction[T_OutputDatum]
    metric_metadata: EvaluationMetricMetadata[T_OutputDatum]

    def __call__(self, output_datum: T_OutputDatum) -> Any:
        """
        For convenience, make a Metric callable.
        Similar to torch Module `forward()`.
        """
        return self.evaluation_fn(output_datum)


def _check_substring(output_datum: str, substring: str, case_sensitive: bool) -> bool:
    if case_sensitive:
        return substring in output_datum
    else:
        return substring.lower() in output_datum.lower()


def substring_match(substring: str, case_sensitive: bool = True) -> Metric[str]:
    def _fn(output_datum: str) -> float:
        return float(
            _check_substring(
                output_datum=output_datum,
                substring=substring,
                case_sensitive=case_sensitive,
            )
        )

    return Metric(
        evaluation_fn=_fn,
        metric_metadata=EvaluationMetricMetadata(
            name="substring_match",
            description="1.0 (pass) if contains given substring",
            best_value=1.0,
            worst_value=0.0,
            extra_metadata=dict(substring=substring, case_sensitive=case_sensitive),
        ),
    )


def _calculate_brevity(output_datum: str) -> float:
    if len(output_datum) == 0:
        raise ValueError("Brevity is meaningless for empty string.")
    return float(len(output_datum))


brevity: Metric[str] = Metric(
    evaluation_fn=_calculate_brevity,
    metric_metadata=EvaluationMetricMetadata(
        name="brevity",
        description="Absolute text length",
        best_value=1.0,
        worst_value=float("inf"),
    ),
)
