import os
from typing import Any, Callable, TypeVar
import hypothesis.strategies as st
import lastmile_utils.lib.core.api as cu
import pandas as pd
import pytest
from result import Err, Ok
from aiconfig.Config import AIConfigRuntime
from aiconfig.eval.api import (
    TestSuiteWithInputsSettings,
    brevity,
    substring_match,
    is_sufficiently_whitespacy,
    run_test_suite_with_inputs,
    run_test_suite_outputs_only,
)
from aiconfig.eval.common import SampleEvaluationFunction, T_OutputDatum
from aiconfig.eval.lib import TestSuiteWithInputsSpec, run_test_suite_helper

import hypothesis

from aiconfig.model_parser import InferenceOptions


def current_dir():
    return os.path.dirname(os.path.realpath(__file__))


class MockAIConfigRuntime(AIConfigRuntime):
    def __init__(self):
        pass

    async def run_and_get_output_text(
        self,
        prompt_name: str,
        params: dict[Any, Any] | None = None,
        options: InferenceOptions | None = None,
        **kwargs,
    ) -> str:
        params_ = params or {}
        assert params_.keys() == {
            "the_query"
        }, 'For eval, AIConfig params must have just the key "the_query".'
        the_query = params_["the_query"]
        return f"output_for_{prompt_name}_the_query_{the_query}"


def test_metrics():
    assert brevity("hello").value == 5.0

    assert substring_match("lo w")("hello world").value == 1.0
    assert substring_match("hello", case_sensitive=False)("HELLO world").value == 1.0
    assert substring_match("hello", case_sensitive=True)("HELLO world").value == 0.0


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
        {
            "value": [11.0, 1.0],
        }
    )
    assert out["value"].equals(exp["value"])  # type: ignore


@hypothesis.given(st.data())
@pytest.mark.asyncio
async def test_run_test_suite_outputs_only(data: st.DataObject):
    metrics = [brevity, substring_match("hello")]
    test_pairs = st.tuples(st.text(min_size=1), st.sampled_from(metrics))
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
        "metric_name",
        "metric_description",
        "best_possible_value",
        "worst_possible_value",
    ]
    inputs = df["input"].astype(str).tolist()  # type: ignore[no-untyped-call]
    assert cu.only(inputs) == Ok("Missing")

    df_brevity = df[df["metric_name"] == "brevity"]
    assert (
        df_brevity["aiconfig_output"].apply(len)  # type: ignore[no-untyped-call]
        == df_brevity["value"]  # type: ignore[no-untyped-call]
    ).all()


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
    metrics = [brevity, substring_match("hello")]
    test_pairs = st.tuples(st.text(min_size=1), st.sampled_from(metrics))
    user_test_suite_with_inputs = data.draw(
        st.lists(
            test_pairs,
            min_size=1,
        )
    )

    input_data, _ = cu.unzip(user_test_suite_with_inputs)

    mock_aiconfig = MockAIConfigRuntime()

    out = await run_test_suite_helper(
        TestSuiteWithInputsSpec(
            test_suite=user_test_suite_with_inputs,
            prompt_name="prompt0",
            aiconfig=mock_aiconfig,
        )
    )

    match out:
        case Ok(df):
            assert isinstance(df, pd.DataFrame)
            assert df.shape[0] == (len(user_test_suite_with_inputs))
            assert df.columns.tolist() == [
                "input",
                "aiconfig_output",
                "value",
                "metric_name",
                "metric_description",
                "best_possible_value",
                "worst_possible_value",
            ]
            inputs = df["input"].astype(str).tolist()  # type: ignore[no-untyped-call]
            assert set(df["input"]) == set(input_data)  # type: ignore[no-untyped-call]

            df_brevity = df[df["metric_name"] == "brevity"]
            assert (
                df_brevity["aiconfig_output"].apply(len)  # type: ignore[no-untyped-call]
                == df_brevity["value"]  # type: ignore[no-untyped-call]
            ).all()
        case Err(e):
            assert False, f"expected Ok, got Err({e})"


def _extract_id(
    metric_fn: SampleEvaluationFunction[T_OutputDatum], metric_input: T_OutputDatum
) -> str:
    return metric_fn(metric_input).interpretation.id


def _extract_id_pair_for_input_pair(
    metric: SampleEvaluationFunction[str], input_pair: tuple[str, str]
) -> tuple[str, str]:
    return (
        _extract_id(metric_fn=metric, metric_input=input_pair[0]),
        _extract_id(metric_fn=metric, metric_input=input_pair[1]),
    )


def _extract_id_pair_for_metric_pair(
    metric_pair: tuple[SampleEvaluationFunction[str], SampleEvaluationFunction[str]],
    metric_input: str,
) -> tuple[str, str]:
    return (
        _extract_id(metric_fn=metric_pair[0], metric_input=metric_input),
        _extract_id(metric_fn=metric_pair[1], metric_input=metric_input),
    )


@st.composite
def _sample_string_pairs(draw: st.DrawFn) -> tuple[str, str]:
    return draw(
        st.tuples(st.text(min_size=1), st.text(min_size=1)).filter(
            lambda t: t[0] != t[1]
        )
    )


@st.composite
def _sample_id_pair_for_metric_different_inputs(
    draw: st.DrawFn, metric: SampleEvaluationFunction[str]
) -> tuple[str, str]:
    input_pair = draw(_sample_string_pairs())
    return _extract_id_pair_for_input_pair(metric, input_pair)


@st.composite
def _check_metric_id_property_2(
    draw: st.DrawFn, metric: SampleEvaluationFunction[str]
) -> bool:
    # Property 2: IDs are the same for a metric (all parameters are the same)
    # even on different inputs.
    id_pair = draw(_sample_id_pair_for_metric_different_inputs(metric))
    return cu.is_unique(id_pair)


T_MetricParams = TypeVar("T_MetricParams")


def _make_strategy_sample_pairs_different_metrics_with_params(
    parametrized_metric_fn: Callable[[T_MetricParams], SampleEvaluationFunction[str]],
    params_strat: st.SearchStrategy[T_MetricParams],
) -> st.SearchStrategy[
    tuple[SampleEvaluationFunction[str], SampleEvaluationFunction[str]]
]:
    return (
        st.tuples(params_strat, params_strat)
        .filter(lambda t: t[0] != t[1])
        .map(lambda t: (parametrized_metric_fn(t[0]), parametrized_metric_fn(t[1])))
    )


@st.composite
def _check_metric_id_property_1(
    draw: st.DrawFn,
    metric_create_fn: Callable[[T_MetricParams], SampleEvaluationFunction[str]],
    params_strat: st.SearchStrategy[T_MetricParams],
) -> bool:
    # Property 1: IDs are unique for a metric if any parameter is different.
    # Sample two metric that share everything but a parameter value,
    # in this case the substring being matched.
    # They should have different IDs even when run on the same input.

    metric_pairs_different = draw(
        _make_strategy_sample_pairs_different_metrics_with_params(
            parametrized_metric_fn=metric_create_fn,
            params_strat=params_strat,
        )
    )
    string_input = draw(st.text(min_size=1))
    id_pair = _extract_id_pair_for_metric_pair(metric_pairs_different, string_input)
    return cu.is_unique(id_pair)


@st.composite
def _check_id_properties_for_parametrized_metric(
    draw: st.DrawFn,
    metric_create_fn: Callable[[T_MetricParams], SampleEvaluationFunction[str]],
    params_strat: st.SearchStrategy[T_MetricParams],
) -> bool:
    """Check both properties for a parametrized metric.

    Args:
        draw (st.DrawFn): don't pass this explicitly. Use draw()
        metric_create_fn (Callable[[T_MetricParams], SampleEvaluationFunction[str]]): _description_
        This is how to create a metric from parameters, e.g. function `substring_match`.
        params_strat (st.SearchStrategy[T_MetricParams]): 
            This needs to generate the data that is used to create the metric, 
            e.g. the substring to check for.

    Returns:
        bool: Result of the two ID property checks.
    """
    property1 = draw(_check_metric_id_property_1(metric_create_fn, params_strat))

    metric_concrete = metric_create_fn(draw(params_strat))
    property2 = draw(_check_metric_id_property_2(metric_concrete))
    return property1 and property2


@pytest.mark.asyncio
async def test_metric_library_id_properties():
    # Parametrized metrics like is_whitespacey and substring_match
    # are each actually classes of metrics, with different parameter values.
    # In this case we have to check both properties.
    assert _check_id_properties_for_parametrized_metric(
        substring_match, st.text(min_size=1)
    )
    assert _check_id_properties_for_parametrized_metric(
        is_sufficiently_whitespacy, st.floats()
    )

    # For concrete (non-parametrized) metrics like brevity,
    # we only need to check property 2.
    # Brevity is just a metric itself, not a class of metrics.

    assert _check_metric_id_property_2(brevity)