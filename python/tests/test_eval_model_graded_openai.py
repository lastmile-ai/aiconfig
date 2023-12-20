from typing import cast

import aiconfig.eval.openai as lib_openai
import openai.types.chat as openai_chat_types
import openai.types.chat.chat_completion as openai_chat_completion_types
import openai.types.chat.chat_completion_message_tool_call as openai_tool_call_types
import pytest
from aiconfig.eval import common
from aiconfig.eval.api import metrics, run_test_suite_outputs_only
from result import Ok, Result


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
    metric_data = cast(common.CustomMetricPydanticObject[common.TextRatingsData], df.loc[0, "value"]).data
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
