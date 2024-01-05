import copy
from abc import abstractmethod
from typing import TYPE_CHECKING, Dict, List, Optional, Union

import openai
from aiconfig.callback import CallbackEvent
from aiconfig.default_parsers.parameterized_model_parser import ParameterizedModelParser
from aiconfig.model_parser import InferenceOptions
from aiconfig.util.config_utils import get_api_key_from_environment
from aiconfig.util.params import resolve_prompt, resolve_prompt_string, resolve_system_prompt
from openai.types.chat import ChatCompletionMessage

from aiconfig.schema import (
    ExecuteResult,
    FunctionCallData,
    Output,
    OutputDataWithToolCallsValue,
    OutputDataWithValue,
    Prompt,
    PromptInput,
    PromptMetadata,
    ToolCallData,
)

if TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime


class OpenAIInference(ParameterizedModelParser):
    def __init__(self):
        super().__init__()

    @abstractmethod
    def id(self) -> str:
        """
        Returns an identifier for the model (e.g. gpt-3.5, gpt-4, etc.).
        """
        return self.id

    async def serialize(
        self,
        prompt_name: str,
        data: Dict,
        ai_config: "AIConfigRuntime",
        parameters: Optional[Dict],
        **kwargs,
    ) -> List[Prompt]:
        """
        Defines how prompts and model inference settings get serialized in the .aiconfig.

        Args:
            prompt (str): The prompt to be serialized.
            inference_settings (dict): Model-specific inference settings to be serialized.

        Returns:
            str: Serialized representation of the prompt and inference settings.
        """
        event = CallbackEvent(
            "on_serialize_start",
            __name__,
            {
                "prompt_name": prompt_name,
                "data": data,
                "parameters": parameters,
                "kwargs": kwargs,
            },
        )
        await ai_config.callback_manager.run_callbacks(event)
        prompts = []

        # Combine conversation data with any extra keyword args
        conversation_data = {**data}

        if not "messages" in conversation_data:
            raise ValueError("Data must have `messages` array to match openai api spec")

        # Find first system prompt. Every prompt in the config will bet set to use this system prompt.
        system_prompt = None
        for message in conversation_data["messages"]:
            if "role" in message and message["role"] == "system":
                # Note: system prompt for openai represented will be an object with content and role attributes {content: str, role: str}
                system_prompt = message
                break

        # Get the global settings for the model
        model_name = conversation_data["model"] if "model" in conversation_data else self.id()

        model_metadata = ai_config.get_model_metadata(conversation_data, model_name)
        # Remove messages array from model metadata. Handled separately
        model_metadata.settings.pop("messages", None)

        # Add in system prompt
        if system_prompt:
            model_metadata.settings["system_prompt"] = system_prompt

        i = 0
        while i < len(conversation_data["messages"]):
            messsage = conversation_data["messages"][i]
            role = messsage["role"]
            if role == "user" or role == "function":
                # Serialize User message as a prompt and save the assistant response as an output
                assistant_response: Union[ChatCompletionMessage, None] = None
                if i + 1 < len(conversation_data["messages"]):
                    next_message = conversation_data["messages"][i + 1]
                    if next_message["role"] == "assistant":
                        assistant_response = next_message
                        i += 1
                new_prompt_name = f"{prompt_name}_{len(prompts) + 1}"

                input = messsage["content"] if role == "user" else PromptInput(**messsage)

                assistant_output = []
                if assistant_response is not None:
                    output_data = build_output_data(assistant_response)
                    metadata = {"raw_response": assistant_response}
                    if assistant_response.get("role", None) is not None:
                        metadata["role"] = assistant_response.get("role")
                    assistant_output = [
                        ExecuteResult(
                            output_type="execute_result",
                            execution_count=None,
                            data=output_data,
                            metadata=metadata,
                        )
                    ]
                prompt = Prompt(
                    name=new_prompt_name,
                    input=input,
                    metadata=PromptMetadata(
                        **{
                            "model": copy.deepcopy(model_metadata),
                            "parameters": parameters,
                            "remember_chat_context": True,
                        }
                    ),
                    outputs=assistant_output,
                )
                prompts.append(prompt)
            i += 1

        if prompts:
            prompts[len(prompts) - 1].name = prompt_name

        event = CallbackEvent("on_serialize_complete", __name__, {"result": prompts})
        await ai_config.callback_manager.run_callbacks(event)
        return prompts

    async def deserialize(self, prompt: Prompt, aiconfig: "AIConfigRuntime", params: Optional[Dict] = {}) -> Dict:
        """
        Defines how to parse a prompt in the .aiconfig for a particular model
        and constructs the completion params for that model.

        Args:
            serialized_data (str): Serialized data from the .aiconfig.

        Returns:
            dict: Model-specific completion parameters.
        """
        await aiconfig.callback_manager.run_callbacks(CallbackEvent("on_deserialize_start", __name__, {"prompt": prompt, "params": params}))
        # Build Completion params
        model_settings = self.get_model_settings(prompt, aiconfig)

        completion_params = refine_chat_completion_params(model_settings)

        # In the case thhat the messages array weren't saves as part of the model settings, build it here. Messages array is used for conversation history.
        if not completion_params.get("messages"):
            completion_params["messages"] = []

            # Add System Prompt
            if model_settings.get("system_prompt", None) is not None:
                system_prompt = model_settings["system_prompt"]
                if isinstance(system_prompt, dict):
                    # If system prompt is an object, then it should have content and role attributes
                    system_prompt = system_prompt["content"]
                resolved_system_prompt = resolve_system_prompt(prompt, system_prompt, params, aiconfig)
                completion_params["messages"].append({"content": resolved_system_prompt, "role": "system"})

            # Default to always use chat context
            if not hasattr(prompt.metadata, "remember_chat_context") or (
                hasattr(prompt.metadata, "remember_chat_context") and prompt.metadata.remember_chat_context != False
            ):
                # handle chat history. check previous prompts for the same model. if same model, add prompt and its output to completion data if it has a completed output
                for i, previous_prompt in enumerate(aiconfig.prompts):
                    # include prompts upto the current one
                    if previous_prompt.name == prompt.name:
                        break

                    if aiconfig.get_model_name(previous_prompt) == aiconfig.get_model_name(prompt):
                        # Add prompt and its output to completion data. Constructing this prompt will take into account available parameters.
                        add_prompt_as_message(
                            previous_prompt,
                            aiconfig,
                            completion_params["messages"],
                            params,
                        )
        else:
            # If messages are already specified in the model settings, then just resolve each message with the given parameters and append the latest message
            for i in range(len(completion_params.get("messages"))):
                completion_params["messages"][i]["content"] = resolve_prompt_string(
                    prompt,
                    params,
                    aiconfig,
                    completion_params["messages"][i]["content"],
                )

        # Add in the latest prompt
        add_prompt_as_message(prompt, aiconfig, completion_params["messages"], params)
        await aiconfig.callback_manager.run_callbacks(CallbackEvent("on_deserialize_complete", __name__, {"output": completion_params}))
        return completion_params

    async def run_inference(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        options: InferenceOptions,
        parameters,
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

        if not openai.api_key:
            openai.api_key = get_api_key_from_environment("OPENAI_API_KEY")

        completion_data = await self.deserialize(prompt, aiconfig, parameters)
        # if stream enabled in runtime options and config, then stream. Otherwise don't stream.
        # const stream = options?.stream ?? completionParams.stream ?? true;
        stream = True  # Default value

        if options is not None and options.stream is not None:
            stream = options.stream
        elif "stream" in completion_data:
            stream = completion_data["stream"]

        completion_data["stream"] = stream

        response = openai.chat.completions.create(**completion_data)
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

    def get_prompt_template(self, prompt: Prompt, aiconfig: "AIConfigRuntime") -> str:
        """
        Returns a template for a prompt.
        """
        if isinstance(prompt.input, str):
            return prompt.input
        elif isinstance(prompt.input, PromptInput) and isinstance(prompt.input.data, str):
            return prompt.input.data
        else:
            message = prompt.input
            return message.content or ""

    def get_output_text(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        output: Optional[Output] = None,
    ) -> str:
        if not output:
            output = aiconfig.get_latest_output(prompt)

        if not output:
            return ""

        if output.output_type == "execute_result":
            output_data = output.data
            if isinstance(output_data, str):
                return output_data
            if isinstance(output_data, OutputDataWithValue):
                if isinstance(output_data.value, str):
                    return output_data.value
                # If we get here that means it must be of kind tool_calls
                return output_data.model_dump_json(exclude_none=True, indent=2)
            # Doing this to be backwards-compatible with old output format
            # where we used to save the ChatCompletionMessage in output.data
            if isinstance(output_data, ChatCompletionMessage):
                if hasattr(output_data, "content") and output_data.content is not None:
                    return output_data.content
                elif output_data.function_call is not None:
                    return str(output_data.function_call)
        return ""


class DefaultOpenAIParser(OpenAIInference):
    def __init__(self, model_id: str):
        super().__init__()
        self.model_id = model_id

    def id(self) -> str:
        return self.model_id


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


def refine_chat_completion_params(model_settings):
    # completion parameters to be used for openai's chat completion api
    # system prompt handled separately
    # streaming handled seperatly.
    # Messages array built dynamically and handled separately
    supported_keys = {
        "frequency_penalty",
        "functions",
        "function_call",
        "logit_bias",
        "max_tokens",
        "model",
        "messages",
        "n",
        "presence_penalty",
        "stop",
        "stream",
        "temperature",
        "tools",
        "tool_choice",
        "top_p",
        "user",
    }

    completion_data = {}
    for key in supported_keys:
        if key in model_settings:
            completion_data[key] = model_settings[key]

    return completion_data


def add_prompt_as_message(prompt: Prompt, aiconfig: "AIConfigRuntime", messages: List, params=None):
    """
    Converts a given prompt to a message and adds it to the specified messages list.

    Note:
    - If the prompt contains valid input, it's treated as a user message.
    - If the prompt has a custom role, function call, or name, these attributes are included in the message.
    - If an AI model output exists, it is appended to the messages list.
    """
    if is_prompt_template(prompt):
        resolved_prompt = resolve_prompt(prompt, params, aiconfig)
        messages.append({"content": resolved_prompt, "role": "user"})
    else:
        # Assumes Prompt input will be in the format of ChatCompletionMessageParam (with content, role, function_name, and name attributes)
        resolved_prompt = resolve_prompt_string(prompt, params, aiconfig, prompt.input.content)

        prompt_input = prompt.input
        role = prompt_input.role if hasattr(prompt_input, "role") else "user"
        fn_call = prompt_input.function_call if hasattr(prompt_input, "function_call") else None
        name = prompt_input.name if hasattr(prompt_input, "name") else None

        message_data = {"content": resolved_prompt, "role": role}

        # filter out None values
        if fn_call is not None:
            message_data["function_call"] = fn_call
        if name is not None:
            message_data["name"] = name

        messages.append(message_data)

    output = aiconfig.get_latest_output(prompt)
    if output:
        if output.output_type == "execute_result":
            assert isinstance(output, ExecuteResult)
            output_data = output.data
            role = output.metadata.get("role", None) or ("raw_response" in output.metadata and output.metadata["raw_response"].get("role", None))

            if role == "assistant":
                output_message = {}
                content: Union[str, None] = None
                function_call: Union[FunctionCallData, None] = None
                if isinstance(output_data, str):
                    content = output_data
                elif isinstance(output_data, OutputDataWithValue):
                    if isinstance(output_data.value, str):
                        content = output_data.value
                    elif output_data.kind == "tool_calls":
                        assert isinstance(output_data, OutputDataWithToolCallsValue)
                        function_call = output_data.value[len(output_data.value) - 1].function

                output_message["content"] = content
                output_message["role"] = role

                # We should update this to use ChatCompletionAssistantMessageParam
                # object with field `tool_calls. See comment for details:
                # https://github.com/lastmile-ai/aiconfig/pull/610#discussion_r1437174736
                if function_call is not None:
                    output_message["function_call"] = function_call

                name = output.metadata.get("name", None) or ("raw_response" in output.metadata and output.metadata["raw_response"].get("name", None))
                if name is not None:
                    output_message["name"] = name

                messages.append(output_message)

            # Doing this to be backwards-compatible with old output format
            # where we used to save the ChatCompletionMessage in output.data
            elif isinstance(output_data, ChatCompletionMessage):
                if output_data.role == "assistant":
                    messages.append(output_data)

    return messages


def is_prompt_template(prompt: Prompt):
    """
    Check if a prompt's input is a valid string.
    """
    return isinstance(prompt.input, str) or (hasattr(prompt.input, "data") and isinstance(prompt.input.data, str))


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
            tool_call_type = item.get("type")
            if tool_call_type != "function":
                # It's possible that ChatCompletionMessageToolCall may
                # support more than just function calls in the future
                # so filter out other types of tool calls for now
                continue

            function = item.get("function")
            tool_calls.append(
                ToolCallData(
                    id=item.get("id"),
                    function=FunctionCallData(
                        arguments=function.get("arguments"),
                        name=function.get("name"),
                    ),
                    type=tool_call_type,
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
