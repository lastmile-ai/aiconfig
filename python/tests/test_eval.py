import itertools
import logging
import os
from typing import Any, cast

import aiconfig.eval.openai as lib_openai
import hypothesis
import hypothesis.strategies as st
import lastmile_utils.lib.core.api as cu
import openai.types.chat as openai_chat_types
import openai.types.chat.chat_completion as openai_chat_completion_types
import openai.types.chat.chat_completion_message_tool_call as openai_tool_call_types
import pandas as pd
import pytest
from aiconfig.Config import AIConfigRuntime
from aiconfig.eval import common
from aiconfig.eval.api import TestSuiteWithInputsSettings, metrics, run_test_suite_outputs_only, run_test_suite_with_inputs
from aiconfig.eval.lib import TestSuiteWithInputsSpec, run_test_suite_helper
from aiconfig.model_parser import InferenceOptions
from result import Err, Ok, Result

brevity = metrics.brevity
substring_match = metrics.substring_match


def set_pd():
    pd.set_option("display.max_rows", 50)
    pd.set_option("display.max_columns", 50)
    pd.set_option("display.expand_frame_repr", True)
    pd.set_option("display.width", 1000)

    pd.set_option("display.max_colwidth", 50)


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
        **kwargs, # type: ignore
    ) -> str:
        """
        This overrides the real method for mocking, but the output doesn't matter very much.
        We're currently not really testing properties of the output.
        We just have to return a string so the tests work.

        Real method: https://github.com/lastmile-ai/aiconfig/blob/a4376d1f951e19776633d397a3cda7fa85506eef/python/src/aiconfig/Config.py#L277
        """
        params_ = params or {}
        assert params_.keys() == {"the_query"}, 'For eval, AIConfig params must have just the key "the_query".'
        the_query = params_["the_query"]
        return f"output_for_{prompt_name}_the_query_{the_query}"


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
            "value": [11.0, True],
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
    assert cu.only(inputs) == Ok("Missing")  # type: ignore

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


@pytest.mark.asyncio
async def test_custom_metric_type():
    user_test_suite_outputs_only = list(
        itertools.product(
            ["nltk is amazing", "whats for dinner?", "oh, bother"],
            [
                metrics.sentiment_scores,
                metrics.sentiment_class,
                metrics.sentiment_score_overall_positive,
            ],
        )
    )
    df = await run_test_suite_outputs_only(user_test_suite_outputs_only)
    result = df.set_index(["metric_name", "aiconfig_output"]).value.unstack(0).to_dict()  # type: ignore
    assert result["sentiment_class"] == {
        "nltk is amazing": "pos",
        "whats for dinner?": "neu",
        "oh, bother": "neg",
    }

    assert all(isinstance(v, metrics.TextSentimentScores) for v in result["sentiment_scores"].values())  # type: ignore

    assert all(isinstance(v, metrics.TextOverallPositiveSentiment) for v in result["sentiment_score_overall_positive"].values())  # type: ignore

    neutral = metrics.TextOverallPositiveSentiment(pos=0.0, neg=0.0)

    assert result["sentiment_score_overall_positive"]["nltk is amazing"] > neutral
    assert result["sentiment_score_overall_positive"]["oh, bother"] < neutral


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


def _mock_response(function_args: common.SerializedJSON) -> openai_chat_types.ChatCompletion:
    return openai_chat_types.ChatCompletion(
        id="123",
        choices=[
            openai_chat_completion_types.Choice(
                index=0,
                message=openai_chat_types.ChatCompletionMessage(
                    content=None,
                    role="assistant",
                    tool_calls=[
                        openai_chat_types.ChatCompletionMessageToolCall(
                            id="cm-tk-1",
                            type="function",
                            function=openai_tool_call_types.Function(
                                name="dummy",
                                arguments=function_args,
                            ),
                        )
                    ],
                ),
                finish_reason="stop",
            )
        ],
        created=0,
        model="",
        object="chat.completion",
    )


def _make_mock_openai_chat_completion_create(function_arguments_return: common.SerializedJSON) -> lib_openai.OpenAIChatCompletionCreate:
    def _mock_openai_chat_completion_create(
        completion_params: lib_openai.OpenAIChatCompletionParams,
    ) -> Result[openai_chat_types.ChatCompletion, str]:
        return Ok(
            _mock_response(
                function_arguments_return,
            )
        )

    return _mock_openai_chat_completion_create


@pytest.mark.asyncio
async def test_openai_structured_eval():
    _mock_create = _make_mock_openai_chat_completion_create(
        common.SerializedJSON('{"conciseness_rating": 5, "conciseness_confidence": 0.9, "conciseness_reasoning": "I think it\'s pretty concise."}')
    )
    mock_metric = metrics.make_openai_structured_llm_metric(
        eval_llm_name="gpt-3.5-turbo-0613",
        pydantic_basemodel_type=common.TextRatingsData,
        metric_name="text_ratings",
        metric_description="Text ratings",
        field_descriptions=dict(
            conciseness_rating="1 to 5 rating of conciseness",
            conciseness_confidence="0 to 1.0 rating of confidence in conciseness rating",
            conciseness_reasoning="reasoning behind the conciseness rating",
        ),
        openai_chat_completion_create=_mock_create,
    )

    user_test_suite_outputs_only = [
        ("one two three", mock_metric),
    ]
    df = await run_test_suite_outputs_only(user_test_suite_outputs_only)
    metric_data = cast(common.CustomMetricPydanticObject[metrics.TextRatingsData], df.loc[0, "value"]).data
    assert isinstance(metric_data, common.TextRatingsData)
    metric_json = metric_data.to_dict()
    assert metric_json == {"conciseness_rating": 5, "conciseness_confidence": 0.9, "conciseness_reasoning": "I think it's pretty concise."}


@pytest.mark.asyncio
async def test_bad_structured_eval_metric():
    _mock_create = _make_mock_openai_chat_completion_create(
        common.SerializedJSON('{"conciseness_rating": 5, "conciseness_confidence": 0.9, "conciseness_reasoning": "I think it\'s pretty concise."}')
    )

    with pytest.raises(ValueError) as exc:
        _ = metrics.make_openai_structured_llm_metric(
            eval_llm_name="gpt-3.5-turbo-0613",
            pydantic_basemodel_type=common.TextRatingsData,
            metric_name="text_ratings",
            metric_description="Text ratings",
            field_descriptions=dict(
                fake_field="123",
                conciseness_rating="1 to 5 rating of conciseness",
                conciseness_confidence="0 to 1.0 rating of confidence in conciseness rating",
                conciseness_reasoning="reasoning behind the conciseness rating",
            ),
            openai_chat_completion_create=_mock_create,
        )

    assert "The following field_descriptions keys are not in the schema" in str(exc)
