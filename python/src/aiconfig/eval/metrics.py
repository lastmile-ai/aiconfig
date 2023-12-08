from functools import partial

from aiconfig.eval.common import (
    EvaluationMetricMetadata,
    Metric,
)


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
        calculate=_fn,
        interpretation=EvaluationMetricMetadata(
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
    calculate=_calculate_brevity,
    interpretation=EvaluationMetricMetadata(
        name="brevity",
        description="Absolute text length",
        best_value=1.0,
        worst_value=float("inf"),
    ),
)


def _is_sufficiently_whitespacy_fn(
    output_datum: str, min_whitespace_ratio: float
) -> float:
    if len(output_datum) == 0:
        raise ValueError("Whitespace ratio is undefined for empty string.")

    def _ratio(output_datum: str) -> float:
        return len(output_datum) / len(output_datum)

    return float(_ratio(output_datum) >= min_whitespace_ratio)


def is_sufficiently_whitespacy(
    min_whitespace_ratio: float,
) -> Metric[str]:
    """
    Check if a string has enough whitespace characters.
    Returns 1.0 (pass) IFF the string's whitespace ratio meets the threshold,
    otherwise 0.0 (fail).
    """
    return Metric(
        calculate=partial(
            _is_sufficiently_whitespacy_fn, min_whitespace_ratio=min_whitespace_ratio
        ),
        interpretation=EvaluationMetricMetadata(
            name="whitespace_ratio",
            description=f"1.0 (pass) if whitespace ratio >= {min_whitespace_ratio}",
            best_value=1.0,
            worst_value=0.0,
        ),
    )
