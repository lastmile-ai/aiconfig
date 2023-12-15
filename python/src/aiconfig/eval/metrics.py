from functools import total_ordering
from typing import Any, Generic

from attr import dataclass
import pandas as pd
from aiconfig.eval.common import (
    CustomMetricValue,
    EvaluationMetricMetadata,
    EvaluationFunction,
    T_OutputDatum,
)


from nltk.sentiment.vader import SentimentIntensityAnalyzer
import nltk


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
    def _fn(output_datum: str) -> bool:
        return _check_substring(
            output_datum=output_datum,
            substring=substring,
            case_sensitive=case_sensitive,
        )

    return Metric(
        evaluation_fn=_fn,
        metric_metadata=EvaluationMetricMetadata(
            name="substring_match",
            description="True (pass) if contains given substring",
            best_value=True,
            worst_value=False,
            extra_metadata=dict(substring=substring, case_sensitive=case_sensitive),
        ),
    )


def _calculate_brevity(output_datum: str) -> int:
    if len(output_datum) == 0:
        raise ValueError("Brevity is meaningless for empty string.")
    return len(output_datum)


brevity: Metric[str] = Metric(
    evaluation_fn=_calculate_brevity,
    metric_metadata=EvaluationMetricMetadata(
        name="brevity",
        description="Absolute text length",
        best_value=1.0,
        worst_value=float("inf"),
    ),
)


@dataclass
class TextSentimentScores(CustomMetricValue):
    mapping: dict[str, float]
    pos: float
    neg: float
    neu: float
    compound: float
    highest: str

@total_ordering
@dataclass(eq=False)
class TextOverallPositiveSentiment(CustomMetricValue):
    """Compare by total positive sentiment: positive - negative"""

    pos: float
    neg: float

    def __eq__(self, other: Any) -> bool:
        """Overrides the default implementation"""
        return isinstance(other, TextOverallPositiveSentiment) and (
            self.pos,
            self.neg,
        ) == (other.pos, other.neg)

    def __lt__(self, other: Any) -> bool:
        if not isinstance(other, TextOverallPositiveSentiment):
            raise TypeError(
                f"Cannot compare TextPositiveSentimentScores with {type(other)}"
            )
        return self.pos - self.neg < other.pos - other.neg


def _get_sentiment_scores(output_datum: str) -> TextSentimentScores:
    nltk.download("vader_lexicon", quiet=True)  # type: ignore
    sid = SentimentIntensityAnalyzer()
    mapping: dict[str, float] = sid.polarity_scores(output_datum)  # type: ignore
    highest: str = pd.Series(mapping).idxmax()  # type: ignore
    return TextSentimentScores(mapping=mapping, **mapping, highest=highest)


def _get_sentiment(output_datum: str) -> str:
    return _get_sentiment_scores(output_datum).highest


def _get_overall_positive_sentiment(output_datum: str) -> TextOverallPositiveSentiment:
    scores = _get_sentiment_scores(output_datum)
    return TextOverallPositiveSentiment(pos=scores.pos, neg=scores.neg)


sentiment_scores: Metric[str] = Metric(
    evaluation_fn=_get_sentiment_scores,
    metric_metadata=EvaluationMetricMetadata(
        name="sentiment_scores",
        description="Sentiment scores container object",
        best_value=None,
        worst_value=None,
    ),
)


sentiment_class: Metric[str] = Metric(
    evaluation_fn=_get_sentiment,
    metric_metadata=EvaluationMetricMetadata(
        name="sentiment_class",
        description="top sentiment class",
        best_value=None,
        worst_value=None,
    ),
)


sentiment_score_overall_positive: Metric[str] = Metric(
    evaluation_fn=_get_overall_positive_sentiment,
    metric_metadata=EvaluationMetricMetadata(
        name="sentiment_score_overall_positive",
        description="Positive minus negative",
        best_value=TextOverallPositiveSentiment(pos=1.0, neg=0.0),
        worst_value=TextOverallPositiveSentiment(pos=0.0, neg=1.0),
    ),
)
