import copy
from typing import TYPE_CHECKING, Dict, List, Optional, Union

import os
from openai import OpenAI
from openai.types.chat import ChatCompletionMessage
from aiconfig.callback import CallbackEvent
from aiconfig.model_parser import InferenceOptions
from aiconfig.schema import (
    ExecuteResult,
    FunctionCallData,
    Output,
    OutputDataWithValue,
    OutputDataWithToolCallsValue,
    Prompt,
    ToolCallData,
)

from .openai import OpenAIInference

if TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime


class AnyscaleEndpoint(OpenAIInference):
    async def run_inference(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        options: InferenceOptions,
        parameters: Optional[Dict],
    ) -> List[Output]:
        """
        Invoked to run a prompt in the .aiconfig. This method should perform
        the actual model inference based on the provided prompt and inference settings.

        Args:
            prompt (str): The input prompt.
            inference_settings (dict): Model-specific inference settings.

        Returns:
            ExecuteResult: The response from the model.
        """
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_run_start",
                __name__,
                {"prompt": prompt, "options": options, "parameters": parameters},
            )
        )

        anyscale_api_key_name = "ANYSCALE_ENDPOINT_API_KEY"
        openai_api_key_name = "OPENAI_API_KEY"

        if anyscale_api_key_name not in os.environ:
            if openai_api_key_name not in os.environ:
                raise Exception(
                    f"Missing API keys '{anyscale_api_key_name}' and '{openai_api_key_name}' in environment. Expected one of them to be specified"
                )
            else:
                api_key = os.environ[openai_api_key_name]
        else:
            api_key = os.environ[anyscale_api_key_name]

        client = OpenAI(api_key=api_key, base_url="https://api.endpoints.anyscale.com/v1")

        completion_data = await self.deserialize(prompt, aiconfig, parameters)
        # if stream enabled in runtime options and config, then stream. Otherwise don't stream.
        # const stream = options?.stream ?? completionParams.stream ?? true;
        stream = True  # Default value

        if options is not None and options.stream is not None:
            stream = options.stream
        elif "stream" in completion_data:
            stream = completion_data["stream"]

        completion_data["stream"] = stream

        response = client.chat.completions.create(**completion_data)
        outputs = []
        if not stream:
            # # OpenAI>1.0.0 uses pydantic models for response
            response = response.model_dump(exclude_none=True)

            response_without_choices = {key: copy.deepcopy(value) for key, value in response.items() if key != "choices"}
            for i, choice in enumerate(response.get("choices")):
                output_message = choice["message"]
                output_data = build_output_data(output_message)

                response_without_choices.update({"finish_reason": choice.get("finish_reason")})
                metadata = {"raw_response": output_message, **response_without_choices}
                if output_message.get("role", None) is not None:
                    metadata["role"] = output_message.get("role")

                output = ExecuteResult(
                    **{
                        "output_type": "execute_result",
                        "data": output_data,
                        "execution_count": i,
                        "metadata": metadata,
                    }
                )

                outputs.append(output)
        else:
            outputs = {}
            messages = {}
            for chunk in response:
                # OpenAI>1.0.0 uses pydantic models. Chunk is of type ChatCompletionChunk; type is not directly importable from openai Library, will require some diffing
                chunk = chunk.model_dump(exclude_none=True)
                chunk_without_choices = {key: copy.deepcopy(value) for key, value in chunk.items() if key != "choices"}
                # streaming only returns one chunk, one choice at a time (before 1.0.0). The order in which the choices are returned is not guaranteed.
                messages = multi_choice_message_reducer(messages, chunk)

                for i, choice in enumerate(chunk["choices"]):
                    index = choice.get("index")
                    accumulated_message_for_choice = messages.get(index, "")
                    delta = choice.get("delta")

                    if options and options.stream_callback:
                        options.stream_callback(delta, accumulated_message_for_choice, index)

                    output = ExecuteResult(
                        **{
                            "output_type": "execute_result",
                            "data": accumulated_message_for_choice,
                            "execution_count": index,
                            "metadata": chunk_without_choices,
                        }
                    )
                    outputs[index] = output
            outputs = [outputs[i] for i in sorted(list(outputs.keys()))]

            # Now that we have the complete outputs, we can parse it into our object model properly
            for output in outputs:
                output_message = output.data
                output_data = build_output_data(output.data)

                metadata = {"raw_response": output_message}
                if output_message.get("role", None) is not None:
                    metadata["role"] = output_message.get("role")

                output.data = output_data
                output.metadata = {**output.metadata, **metadata}

        # rewrite or extend list of outputs?
        prompt.outputs = outputs

        await aiconfig.callback_manager.run_callbacks(CallbackEvent("on_run_complete", __name__, {"result": prompt.outputs}))
        return prompt.outputs


class DefaultAnyscaleEndpointParser(AnyscaleEndpoint):
    def __init__(self, model_id: str):
        super().__init__()
        self.model_id = model_id

    def id(self) -> str:
        return self.model_id


class LLaMA2_7B_Chat(DefaultAnyscaleEndpointParser):
    def __init__(self):
        model_id = "meta-llama/Llama-2-7b-chat-hf"
        super().__init__(model_id)


class LLaMA2_13B_Chat(DefaultAnyscaleEndpointParser):
    def __init__(self):
        model_id = "meta-llama/Llama-2-13b-chat-hf"
        super().__init__(model_id)


class LLaMA2_70B_Chat(DefaultAnyscaleEndpointParser):
    def __init__(self):
        model_id = "meta-llama/Llama-2-70b-chat-hf"
        super().__init__(model_id)


class LLaMAGuard_7B(DefaultAnyscaleEndpointParser):
    def __init__(self):
        model_id = "Meta-Llama/Llama-Guard-7b"
        super().__init__(model_id)


class Mistral_7B_OpenOrca(DefaultAnyscaleEndpointParser):
    def __init__(self):
        model_id = "Open-Orca/Mistral-7B-OpenOrca"
        super().__init__(model_id)


class CodeLLaMA_34B(DefaultAnyscaleEndpointParser):
    def __init__(self):
        model_id = "codellama/CodeLlama-34b-Instruct-hf"
        super().__init__(model_id)


class Zephyr_7B(DefaultAnyscaleEndpointParser):
    def __init__(self):
        model_id = "HuggingFaceH4/zephyr-7b-beta"
        super().__init__(model_id)


class Mistral_7B(DefaultAnyscaleEndpointParser):
    def __init__(self):
        model_id = "mistralai/Mistral-7B-Instruct-v0.1"
        super().__init__(model_id)


class Mixtral_8x7B(DefaultAnyscaleEndpointParser):
    def __init__(self):
        model_id = "mistralai/Mixtral-8x7B-Instruct-v0.1"
        super().__init__(model_id)


def reduce(acc, delta):
    acc = copy.deepcopy(acc)

    for key, value in delta.items():
        if key not in acc:
            # If the key doesn't exist in 'acc', add it with the 'value'
            acc[key] = value
        elif isinstance(acc[key], str) and isinstance(value, str):
            # If both 'acc[key]' and 'value' are strings, concatenate them
            acc[key] += value
        elif isinstance(acc[key], dict) and not isinstance(acc[key], list):
            # If 'acc[key]' is a dictionary (not a list), recursively merge it with 'value'
            acc[key] = reduce(acc[key], value)

    return acc


def multi_choice_message_reducer(messages: Union[Dict[int, dict], None], chunk: dict) -> Dict[int, dict]:
    if messages is None:
        messages = {}

    # elif len(messages) != len(chunk["choices"]):
    #     raise ValueError("Invalid number of previous choices -- it should match the incoming number of choices")

    for choice in chunk["choices"]:
        index = choice["index"]
        previous_message = messages.get(index, {})
        updated_message = reduce(previous_message, choice["delta"])
        messages[index] = updated_message

    return messages


def build_output_data(
    message: Union[ChatCompletionMessage, None],
) -> Union[OutputDataWithValue, str, None]:
    if message is None:
        return None

    output_data: Union[OutputDataWithValue, str, None] = None
    if message.get("content") is not None and message.get("content") != "":
        output_data = message.get("content")  # string
    elif message.get("tool_calls") is not None:
        tool_calls = []
        for item in message.get("tool_calls"):
            function = item.get("function")
            if function is None:
                continue

            tool_calls.append(
                ToolCallData(
                    id=item.get("id"),
                    function=FunctionCallData(
                        arguments=function.get("arguments"),
                        name=function.get("name"),
                    ),
                    type=item.get("type") if not None else "function",
                )
            )

        output_data = OutputDataWithToolCallsValue(
            kind="tool_calls",
            value=tool_calls,
        )

    # Deprecated, use tool_calls instead
    elif message.get("function_call") is not None:
        function_call = message.get("function_call")
        tool_calls = [
            ToolCallData(
                id="function_call_data",  # value here does not matter
                function=FunctionCallData(
                    arguments=function_call["arguments"],
                    name=function_call["name"],
                ),
                type="function",
            )
        ]
        output_data = OutputDataWithToolCallsValue(
            kind="tool_calls",
            value=tool_calls,
        )
    return output_data
