from abc import abstractmethod
from dataclasses import dataclass
from typing import Protocol

import lastmile_utils.lib.core.api as cu
import openai
import openai.types.chat as openai_types
from aiconfig.eval import common
from aiconfig.eval.model_graded_eval import CompletionTextToSerializedJSON
from result import Err, Ok, Result


@dataclass
class OpenAIChatCompletionParams:
    # TODO: type better
    messages: list[openai_types.ChatCompletionMessageParam]
    model: str
    temperature: float
    tools: list[openai_types.ChatCompletionToolParam]


class OpenAIChatCompletionCreate(Protocol):
    @abstractmethod
    def __call__(self, completion_params: OpenAIChatCompletionParams) -> Result[openai_types.ChatCompletion, str]:
        pass


def default_openai_chat_completion_create(completion_params: OpenAIChatCompletionParams) -> Result[openai_types.ChatCompletion, str]:
    try:
        result = openai.chat.completions.create(
            messages=completion_params.messages,
            model=completion_params.model,
            temperature=completion_params.temperature,
            tools=completion_params.tools,
        )
        return Ok(result)
    except Exception as e:
        return cu.ErrWithTraceback(e)


def extract_json_from_chat_completion(chat_completion: openai_types.ChatCompletion) -> Result[common.SerializedJSON, str]:
    choice = chat_completion.choices[0]
    message = choice.message
    if message.tool_calls is None:
        return Err("No tool calls found")

    return Ok(common.SerializedJSON(message.tool_calls[0].function.arguments))


def make_openai_function_chat_completion_str_to_str(
    eval_llm_name: str,
    properties: dict[str, dict[str, str]],
    required: list[str],
    openai_chat_completion_create: OpenAIChatCompletionCreate,
) -> CompletionTextToSerializedJSON:
    def _chat_completion_create(output_datum: str) -> Result[common.SerializedJSON, str]:
        openai_chat_completion_params = _make_openai_completion_params(output_datum, eval_llm_name, properties, required)
        return openai_chat_completion_create(openai_chat_completion_params).and_then(extract_json_from_chat_completion)

    out: CompletionTextToSerializedJSON = _chat_completion_create
    return out


def _make_openai_completion_params(
    input_text: str, eval_llm_name: str, properties: dict[str, dict[str, str]], required: list[str]
) -> OpenAIChatCompletionParams:
    return OpenAIChatCompletionParams(
        messages=[
            {"role": "system", "content": "Call the function with arguments based on the provided text."},
            {"role": "user", "content": input_text},
        ],
        model=eval_llm_name,
        temperature=0,
        tools=[
            {
                "type": "function",
                "function": {
                    "name": "dummy",
                    "description": "Submit ratings that apply to a piece of text",
                    "parameters": {
                        "type": "object",
                        "properties": properties,
                        "required": required,
                    },
                },
            },
        ],
    )
