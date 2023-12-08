import os
from typing import Any, TypeVar
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
    run_test_suite_with_inputs,
    run_test_suite_outputs_only,
)
from aiconfig.eval.lib import TestSuiteWithInputsSpec, run_test_suite_helper

import hypothesis

from aiconfig.model_parser import InferenceOptions

T_MetricParams = TypeVar("T_MetricParams")


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
    assert brevity("hello") == 5.0

    assert substring_match("lo w")("hello world") == 1.0
    assert substring_match("hello", case_sensitive=False)("HELLO world") == 1.0
    assert substring_match("hello", case_sensitive=True)("HELLO world") == 0.0


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
        "metric_id",
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
                "metric_id",
                "metric_name",
                "metric_description",
                "best_possible_value",
                "worst_possible_value",
            ]
            inputs = df["input"].astype(str).tolist()  # type: ignore[no-untyped-call]
            assert set(inputs) == set(input_data)  # type: ignore[no-untyped-call]

            df_brevity = df[df["metric_name"] == "brevity"]
            assert (
                df_brevity["aiconfig_output"].apply(len)  # type: ignore[no-untyped-call]
                == df_brevity["value"]  # type: ignore[no-untyped-call]
            ).all()
        case Err(e):
            assert False, f"expected Ok, got Err({e})"
