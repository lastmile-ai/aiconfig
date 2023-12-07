from functools import partial

from aiconfig.eval.common import (
    EvaluationMetricMetadata,
    SampleEvaluationFunction,
    SampleMetricValue,
)


def check_substring(output_datum: str, substring: str, case_sensitive: bool) -> bool:
    if case_sensitive:
        return substring in output_datum
    else:
        return substring.lower() in output_datum.lower()


def contains_substring(
    output_datum: str, substring: str, case_sensitive: bool
) -> SampleMetricValue[str]:
    return SampleMetricValue(
        value=float(
            check_substring(output_datum, substring, case_sensitive=case_sensitive)
        ),
        interpretation=EvaluationMetricMetadata(
            name="contains_substring",
            description="1.0 (pass) if contains given substring",
            best_value=1.0,
            worst_value=0.0,
        ),
    )


def substring_match(
    substring: str, case_sensitive: bool = True
) -> SampleEvaluationFunction[str]:
    """Convenience function for running `contains_substring()` on a fixed substring.
    Can be used directly to construct a user test suite."""
    return partial(
        contains_substring, substring=substring, case_sensitive=case_sensitive
    )


def brevity(output_datum: str) -> SampleMetricValue[str]:
    def _fn(output_datum: str) -> float:
        if len(output_datum) == 0:
            raise ValueError("Brevity is meaningless for empty string.")
        return float(len(output_datum))

    return SampleMetricValue(
        value=_fn(output_datum),
        interpretation=EvaluationMetricMetadata(
            name="brevity",
            description="Absolute text length",
            best_value=1.0,
            worst_value=float("inf"),
        ),
    )
