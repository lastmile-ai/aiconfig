import itertools
import logging
import os
from typing import Any

import hypothesis
import hypothesis.strategies as st
import lastmile_utils.lib.core.api as core_utils
import pandas as pd
import pytest
from aiconfig.eval.api import TestSuiteWithInputsSettings, metrics, run_test_suite_outputs_only, run_test_suite_with_inputs
from aiconfig.eval.lib import MetricList, TestSuiteGeneralSettings, TestSuiteWithInputsSpec, run_test_suite_helper, text_eval_res_to_df
from result import Err, Ok

from . import mocks

brevity = metrics.brevity
substring_match = metrics.substring_match

MOCK_NLTK_SENTIMENT_SCORE_MAPPING = {
    "nltk is amazing": {"pos": 0.9, "neu": 0.1, "neg": 0.0, "compound": 0.9},
    "whats for dinner?": {"pos": 0.0, "neu": 0.9, "neg": 0.1, "compound": -0.9},
    "oh, bother": {"pos": 0.0, "neu": 0.1, "neg": 0.9, "compound": -0.9},
}


def _compute_mock_sentiment_class_mapping(score_mapping: dict[str, dict[str, float]]) -> dict[str, str]:
    out: dict[str, str] = {}
    for k, scores in score_mapping.items():
        max_class, max_score = "", float("-inf")
        for class_, score in scores.items():
            if score > max_score:
                max_score = score
                max_class = class_
        out[k] = max_class

    return out


MOCK_NLTK_SENTIMENT_CLASS_MAPPING = _compute_mock_sentiment_class_mapping(MOCK_NLTK_SENTIMENT_SCORE_MAPPING)


def set_pd():
    pd.set_option("display.max_rows", 50)
    pd.set_option("display.max_columns", 50)
    pd.set_option("display.expand_frame_repr", True)
    pd.set_option("display.width", 1000)

    pd.set_option("display.max_colwidth", 50)


def current_dir():
    return os.path.dirname(os.path.realpath(__file__))


@pytest.mark.asyncio
async def test_metrics():
    assert await brevity("hello") == 5.0

    assert await substring_match("lo w")("hello world") == 1.0
    assert await substring_match("hello", case_sensitive=False)("HELLO world") == 1.0
    assert await substring_match("hello", case_sensitive=True)("HELLO world") == 0.0


@pytest.mark.asyncio
async def test_run_with_inputs_sanity_check():
    """No easy way to mock LLM calls from outside run_test_suite_with_inputs.

    Instead, give empty list and just test the imports and sanity check output."""

    path = os.path.join(
        current_dir(),
        "../src/aiconfig/eval/examples/travel/travel_parametrized.aiconfig.json",
    )
    out = await run_test_suite_with_inputs(
        [],
        TestSuiteWithInputsSettings(prompt_name="test", aiconfig_path=path),
    )
    assert isinstance(out, pd.DataFrame)
    assert out.shape == (0, 0)


@pytest.mark.asyncio
async def test_run_with_outputs_only_basic():
    test_suite = [
        ("hello world", brevity),
        ("hello world", substring_match("hello")),
    ]
    out = await run_test_suite_outputs_only(test_suite)
    exp = pd.DataFrame(
        data={
            "value": [11, True],
        }
    )
    assert out["value"].equals(exp["value"])  # type: ignore


@hypothesis.given(st.data())
@pytest.mark.asyncio
async def test_run_test_suite_outputs_only(data: st.DataObject):
    metrics_list = [brevity, substring_match("hello")]
    test_pairs = st.tuples(st.text(min_size=1), st.sampled_from(metrics_list))
    user_test_suite_outputs_only = data.draw(
        st.lists(
            test_pairs,
            min_size=1,
        )
    )

    df = await run_test_suite_outputs_only(user_test_suite_outputs_only)
    assert df.shape[0] == (len(user_test_suite_outputs_only))
    assert df.columns.tolist() == [
        "input",
        "aiconfig_output",
        "value",
        "metric_id",
        "metric_name",
        "metric_description",
        "best_possible_value",
        "worst_possible_value",
    ]
    inputs = df["input"].astype(str).tolist()  # type: ignore
    assert core_utils.only(inputs) == Ok("Missing")  # type: ignore

    df_brevity = df[df["metric_name"] == "brevity"]  # type: ignore
    assert (df_brevity["aiconfig_output"].apply(len) == df_brevity["value"]).all()  # type: ignore


@hypothesis.given(st.data())
@pytest.mark.asyncio
async def test_run_test_suite_with_inputs(data: st.DataObject):
    """In test_run_test_suite_outputs_only, we test the user-facing function (e2e)
    In this case that's harder because run_test_suite_with_inputs takes
    an aiconfig path, not object.
    In order to test with a mock AIConfig object, in this test we go one level down
    and test run_test_suite_helper().

    Also see test_run_with_inputs_sanity_check.
    """
    metrics_list = [brevity, substring_match("hello")]
    test_pairs = st.tuples(st.text(min_size=1), st.sampled_from(metrics_list))
    user_test_suite_with_inputs = data.draw(
        st.lists(
            test_pairs,
            min_size=1,
        )
    )

    mock_aiconfig = mocks.MockAIConfigRuntime()

    out = await run_test_suite_helper(
        TestSuiteWithInputsSpec(
            test_suite=user_test_suite_with_inputs, prompt_name="prompt0", aiconfig=mock_aiconfig, general_settings=TestSuiteGeneralSettings()
        )
    )

    df_out = out.map(text_eval_res_to_df)

    match df_out:
        case Ok(df):
            assert isinstance(df, pd.DataFrame)
            assert df.shape[0] == (len(user_test_suite_with_inputs))
            assert df.columns.tolist() == [
                "input",
                "aiconfig_output",
                "value",
                "metric_id",
                "metric_name",
                "metric_description",
                "best_possible_value",
                "worst_possible_value",
            ]

            input_pairs = {(input_datum, metric.metric_metadata.id) for input_datum, metric in user_test_suite_with_inputs}
            result_pairs = set(  # type: ignore[no-untyped-call]
                df[["input", "metric_id"]].itertuples(index=False, name=None)  # type: ignore[no-untyped-call]
            )

            assert input_pairs == result_pairs

            df_brevity = df[df["metric_name"] == "brevity"]  # type: ignore
            assert (df_brevity["aiconfig_output"].apply(len) == df_brevity["value"]).all()  # type: ignore

            df_substring = df[df["metric_name"] == "substring_match"]  # type: ignore
            assert (df_substring["value"].apply(lambda x: x in {False, True})).all()  # type: ignore

        case Err(e):
            assert False, f"expected Ok, got Err({e})"


def _make_mock_nltk_metrics() -> MetricList[str]:
    def _mock_get_nltk_polarity_scores(text: str) -> dict[str, float]:
        return MOCK_NLTK_SENTIMENT_SCORE_MAPPING[text]

    mock_nltk_sentiment_scores_vader = metrics.make_sentiment_scores_metric(
        get_polarity_scores=_mock_get_nltk_polarity_scores,
        make_evaluation_fn=metrics.make_get_sentiment_scores,
        name="nltk_sentiment_scores_vader",
        description="NLTK sentiment scores using Vader",
    )

    mock_nltk_sentiment_class_vader = metrics.make_sentiment_scores_metric(
        get_polarity_scores=_mock_get_nltk_polarity_scores,
        make_evaluation_fn=metrics.make_get_sentiment_class,
        name="nltk_sentiment_class_vader",
        description="Highest-probability NLTK sentiment class using Vader",
    )

    mock_nltk_sentiment_score_overall_positive = metrics.make_sentiment_scores_metric(
        get_polarity_scores=_mock_get_nltk_polarity_scores,
        make_evaluation_fn=metrics.make_get_overall_positive_sentiment,
        name="nltk_sentiment_score_overall_positive",
        description="Positive minus negative",
        best_value=metrics.TextOverallPositiveSentiment(pos=1.0, neg=0.0),
        worst_value=metrics.TextOverallPositiveSentiment(pos=0.0, neg=1.0),
    )

    return [mock_nltk_sentiment_scores_vader, mock_nltk_sentiment_class_vader, mock_nltk_sentiment_score_overall_positive]


@pytest.mark.asyncio
async def test_custom_metric_type():
    mock_nltk_metrics = _make_mock_nltk_metrics()
    user_test_suite_outputs_only = list(
        itertools.product(
            ["nltk is amazing", "whats for dinner?", "oh, bother"],
            mock_nltk_metrics,
        )
    )
    df = await run_test_suite_outputs_only(user_test_suite_outputs_only)
    result = df.set_index(["metric_name", "aiconfig_output"]).value.unstack(0).to_dict()  # type: ignore
    assert result["nltk_sentiment_class_vader"] == MOCK_NLTK_SENTIMENT_CLASS_MAPPING

    assert all(isinstance(v, metrics.TextSentimentScores) for v in result["nltk_sentiment_scores_vader"].values())  # type: ignore

    assert all(isinstance(v, metrics.TextOverallPositiveSentiment) for v in result["nltk_sentiment_score_overall_positive"].values())  # type: ignore

    neutral = metrics.TextOverallPositiveSentiment(pos=0.0, neg=0.0)

    assert result["nltk_sentiment_score_overall_positive"]["nltk is amazing"] > neutral
    assert result["nltk_sentiment_score_overall_positive"]["oh, bother"] < neutral


@pytest.mark.asyncio
async def test_exception_metric(caplog: pytest.LogCaptureFixture):
    user_test_suite_outputs_only = list(
        itertools.product(
            ["Hundred Acre Wood", ""],
            [metrics.brevity],
        )
    )
    with caplog.at_level(logging.ERROR):
        df = await run_test_suite_outputs_only(user_test_suite_outputs_only)
    mapping: dict[str, Any] = df.query("metric_name=='brevity'").set_index("aiconfig_output").value.to_dict()  # type: ignore
    assert mapping["Hundred Acre Wood"] == 17.0
    assert pd.isnull(mapping[""])  # type: ignore

    assert any("Brevity is meaningless for empty string." in record.msg for record in caplog.records)
