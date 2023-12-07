import hypothesis.strategies as st
import lastmile_utils.lib.core.api as cu
import pandas as pd
import pytest
from result import Ok
from aiconfig.eval.api import (
    TestSuiteWithInputsSettings,
    brevity,
    run_test_suite_with_inputs,
    substring_match,
)
from aiconfig.eval.lib import run_test_suite_outputs_only
from hypothesis import given


def test_metrics():
    assert brevity("hello").value == 5.0

    assert substring_match("lo w")("hello world").value == 1.0
    assert substring_match("hello", case_sensitive=False)("HELLO world").value == 1.0
    assert substring_match("hello", case_sensitive=True)("HELLO world").value == 0.0


@pytest.mark.asyncio
async def test_run_with_inputs_sanity_check():
    """No easy way to mock LLM calls,
    so just test the imports and sanity check output."""
    out = await run_test_suite_with_inputs(
        [],
        TestSuiteWithInputsSettings(
            prompt_name="test", aiconfig_path="some/path/we/wont/read"
        ),
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


@given(st.data())
@pytest.mark.asyncio
async def test_run_test_suite_outputs_only(data: st.DataObject):
    Metrics = [brevity, substring_match("hello")]
    TestPairs = st.tuples(st.text(min_size=1), st.sampled_from(Metrics))
    user_test_suite_outputs_only = data.draw(
        st.lists(
            TestPairs,
            min_size=1,
        )
    )

    out = await run_test_suite_outputs_only(user_test_suite_outputs_only)
    assert out.shape[0] == (len(user_test_suite_outputs_only))
    assert out.columns.tolist() == [
        "input",
        "aiconfig_output",
        "value",
        "metric_name",
        "metric_description",
        "best_possible_value",
        "worst_possible_value",
    ]
    inputs = out["input"].astype(str).tolist()  # type: ignore[no-untyped-call]
    assert cu.only(inputs) == Ok("Missing")

    out_brevity = out[out["metric_name"] == "brevity"]
    assert (
        out_brevity["aiconfig_output"].apply(len)  # type: ignore[no-untyped-call]
        == out_brevity["value"]  # type: ignore[no-untyped-call]
    ).all()
