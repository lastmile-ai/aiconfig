from functools import partial

from aiconfig.eval.common import (
    EvaluationMetricMetadata,
    SampleEvaluationFunction,
    SampleMetricValue,
)
import lastmile_utils.lib.core.api as cu


def _check_substring(output_datum: str, substring: str, case_sensitive: bool) -> bool:
    if case_sensitive:
        return substring in output_datum
    else:
        return substring.lower() in output_datum.lower()


def _match_substring_with_string(
    output_datum: str, substring: str, case_sensitive: bool
) -> SampleMetricValue[str]:
    name = "substring_match"
    description = "1.0 (pass) if contains given substring"
    best_value = 1.0
    worst_value = 0.0
    id = cu.hash_id(
        f"{name}{description}{best_value}{worst_value}params={substring}{case_sensitive}"
    )
    return SampleMetricValue(
        value=float(
            _check_substring(output_datum, substring, case_sensitive=case_sensitive)
        ),
        interpretation=EvaluationMetricMetadata(
            id=id,
            name=name,
            description=description,
            best_value=best_value,
            worst_value=worst_value,
        ),
    )


def substring_match(
    substring: str, case_sensitive: bool = True
) -> SampleEvaluationFunction[str]:
    """Convenience function for running `contains_substring()` on a fixed substring.
    Can be used directly to construct a user test suite."""
    return partial(
        _match_substring_with_string, substring=substring, case_sensitive=case_sensitive
    )


def brevity(output_datum: str) -> SampleMetricValue[str]:
    def _fn(output_datum: str) -> float:
        if len(output_datum) == 0:
            raise ValueError("Brevity is meaningless for empty string.")
        return float(len(output_datum))

    name = "brevity"
    description = "Absolute text length"
    best_value = 1.0
    worst_value = float("inf")
    id = cu.hash_id(f"{name}{description}{best_value}{worst_value}params=")

    return SampleMetricValue(
        value=_fn(output_datum),
        interpretation=EvaluationMetricMetadata(
            id=id,
            name=name,
            description=description,
            best_value=best_value,
            worst_value=worst_value,
        ),
    )


def _whitespace_ratio(
    output_datum: str, min_whitespace_ratio: float
) -> SampleMetricValue[str]:
    if len(output_datum) == 0:
        raise ValueError("Whitespace ratio is undefined for empty string.")

    name = "whitespace_ratio"
    description = f"1.0 (pass) if whitespace ratio >= {min_whitespace_ratio}"
    best_value = 1.0
    worst_value = 0.0
    return SampleMetricValue(
        value=float(output_datum.count(" ") / len(output_datum)),
        interpretation=EvaluationMetricMetadata(
            id=cu.hash_id(f"{name}params={min_whitespace_ratio}".encode("utf-8")),
            name=name,
            description=description,
            best_value=best_value,
            worst_value=worst_value,
        ),
    )


def is_sufficiently_whitespacy(
    min_whitespace_ratio: float,
) -> SampleEvaluationFunction[str]:
    """
    Check if a string has enough whitespace characters.
    Returns 1.0 (pass) IFF the string's whitespace ratio meets the threshold,
    otherwise 0.0 (fail).
    """
    return partial(_whitespace_ratio, min_whitespace_ratio=min_whitespace_ratio)
