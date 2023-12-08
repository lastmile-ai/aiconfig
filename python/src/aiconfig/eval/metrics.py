
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
