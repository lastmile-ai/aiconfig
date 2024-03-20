import copy
import re
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union
from aiconfig.util.params import (
    resolve_prompt_string,
    resolve_system_prompt,
)

from aiconfig.callback import CallbackEvent

from .openai import DefaultOpenAIParser, build_output_data

from openai.types.chat import ChatCompletionMessage

from aiconfig.schema import (
    Attachment,
    AttachmentDataWithStringValue,
    ExecuteResult,
    OutputDataWithValue,
    Prompt,
    PromptInput,
    PromptMetadata,
)

if TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime

IMAGE_FORMAT_PATTERN = r"data:image/(\w+);base64"


class OpenAIVisionParser(DefaultOpenAIParser):
    async def serialize(
        self,
        prompt_name: str,
        data: Dict[str, Any],
        ai_config: "AIConfigRuntime",
        parameters: Optional[Dict[str, Any]],
        **kwargs,
    ) -> List[Prompt]:
        """
        Defines how prompts and model inference settings get serialized in the .aiconfig.

        Similar to serialize of DefaultOpenAIParser, however currently, GPT-4 Turbo
        with vision does not support the message.name parameter, functions/tools,
        response_format parameter

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
        prompts: list[Prompt] = []

        # Combine conversation data with any extra keyword args
        conversation_data = {**data}

        if not "messages" in conversation_data:
            raise ValueError(
                "Data must have `messages` array to match openai api spec"
            )

        # Find first system prompt. Every prompt in the config will bet set to use this system prompt.
        system_prompt = None
        for message in conversation_data["messages"]:
            if "role" in message and message["role"] == "system":
                # Note: system prompt for openai represented will be an object with content and role attributes {content: str, role: str}
                system_prompt = message
                break

        # Get the global settings for the model
        model_name = (
            conversation_data["model"]
            if "model" in conversation_data
            else self.id()
        )

        model_metadata = ai_config.get_model_metadata(
            conversation_data, model_name
        )
        # Remove messages array from model metadata. Handled separately
        if model_metadata.settings:
            model_metadata.settings.pop("messages", None)

        # Add in system prompt
        if system_prompt:
            if not model_metadata.settings:
                model_metadata.settings = {}
            model_metadata.settings["system_prompt"] = system_prompt

        i = 0
        while i < len(conversation_data["messages"]):
            message = conversation_data["messages"][i]
            role = message["role"]
            if role == "user":
                # Serialize User message as a prompt and save the assistant response as an output
                assistant_response: Union[ChatCompletionMessage, None] = None
                if i + 1 < len(conversation_data["messages"]):
                    next_message = conversation_data["messages"][i + 1]
                    if next_message["role"] == "assistant":
                        assistant_response = next_message
                        i += 1
                new_prompt_name = f"{prompt_name}_{len(prompts) + 1}"

                content = message["content"]
                input = {}
                # Message can contain text and multiple images
                # See https://platform.openai.com/docs/guides/vision/multiple-image-inputs
                for val in content:
                    if val["type"] == "text":
                        input["data"] = val["text"]
                    if val["type"] == "image_url":
                        if input.get("attachments") is None:
                            input["attachments"] = []
                        image_url: str = val["image_url"]["url"]
                        attachment_kind = (
                            "base64"
                            if image_url.startswith("data:")
                            else "file_uri"
                        )
                        attachment_data = AttachmentDataWithStringValue(
                            kind=attachment_kind, value=image_url
                        )

                        mime_type = "image/*"
                        if attachment_kind == "base64":
                            type_match = re.search(
                                IMAGE_FORMAT_PATTERN, image_url
                            )
                            if type_match:
                                mime_type = f"image/{type_match.group(1)}"

                        input["attachments"].append(
                            Attachment(
                                data=attachment_data, mime_type=mime_type
                            )
                        )

                # openai sdk currently only supports images with user messages
                assistant_output = []
                if assistant_response is not None:
                    output_data = build_output_data(assistant_response)
                    metadata = {
                        "raw_response": assistant_response,
                        role: "assistant",
                    }
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
                    input=PromptInput(
                        data=input.get("data"),
                        attachments=input.get("attachments"),
                    ),
                    metadata=PromptMetadata(
                        model=copy.deepcopy(model_metadata),
                        parameters=parameters,
                        remember_chat_context=True,
                    ),
                    outputs=assistant_output,
                )
                prompts.append(prompt)
            elif i == 0 and role == "assistant":
                # If the first message is an assistant message,
                # build a prompt with an empty input,
                # and the assistant response as the output

                # Pull assistant response
                assistant_output = build_output_data(
                    conversation_data["messages"][i]
                )
                prompt = Prompt(
                    name=f"{prompt_name}_{len(prompts) + 1}",
                    input="",
                    metadata=PromptMetadata(
                        model=copy.deepcopy(model_metadata),
                        parameters=parameters,
                        remember_chat_context=True,
                    ),
                    outputs=[
                        ExecuteResult(
                            output_type="execute_result",
                            execution_count=None,
                            data=assistant_output,
                            metadata={},
                        )
                    ],
                )
                prompts.append(prompt)
            i += 1

        if prompts:
            prompts[len(prompts) - 1].name = prompt_name

        event = CallbackEvent(
            "on_serialize_complete", __name__, {"result": prompts}
        )
        await ai_config.callback_manager.run_callbacks(event)
        return prompts

    async def deserialize(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        params: Optional[Dict[str, Any]] = {},
    ) -> Dict:
        """
        Defines how to parse a prompt in the .aiconfig for a particular model
        and constructs the completion params for that model.

        Args:
            serialized_data (str): Serialized data from the .aiconfig.

        Returns:
            dict: Model-specific completion parameters.
        """
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_deserialize_start",
                __name__,
                {"prompt": prompt, "params": params},
            )
        )
        # Build Completion params
        model_settings = self.get_model_settings(prompt, aiconfig)

        completion_params = refine_chat_completion_params(
            model_settings, aiconfig, prompt
        )

        # In the case that the messages array weren't saved as part of the model settings, build it here. Messages array is used for conversation history.
        if not completion_params.get("messages"):
            completion_params["messages"] = []

            # Add System Prompt
            if model_settings.get("system_prompt", None) is not None:
                system_prompt = model_settings["system_prompt"]
                if isinstance(system_prompt, dict):
                    # If system prompt is an object, then it should have content and role attributes
                    system_prompt = system_prompt["content"]
                resolved_system_prompt = resolve_system_prompt(
                    prompt, system_prompt, params, aiconfig
                )
                completion_params["messages"].append(
                    {"content": resolved_system_prompt, "role": "system"}
                )

            # Default to always use chat context
            if not hasattr(prompt.metadata, "remember_chat_context") or (
                hasattr(prompt.metadata, "remember_chat_context")
                and prompt.metadata.remember_chat_context != False
            ):
                # handle chat history. check previous prompts for the same model. if same model, add prompt and its output to completion data if it has a completed output
                for i, previous_prompt in enumerate(aiconfig.prompts):
                    # include prompts upto the current one
                    if previous_prompt.name == prompt.name:
                        break

                    if aiconfig.get_model_name(
                        previous_prompt
                    ) == aiconfig.get_model_name(prompt):
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
                prompt_content = completion_params["messages"][i]["content"]
                if not prompt_content:
                    continue
                if isinstance(prompt_content, str):
                    completion_params["messages"][i]["content"] = (
                        resolve_prompt_string(
                            prompt,
                            params,
                            aiconfig,
                            prompt_content,
                        )
                    )
                else:
                    # If the prompt content is an array, then it's a ChatCompletionContentPartParam object
                    for j in range(len(prompt_content)):
                        if prompt_content[j].get("text"):
                            prompt_content[j]["text"] = resolve_prompt_string(
                                prompt,
                                params,
                                aiconfig,
                                prompt_content[j]["text"],
                            )

        # Add in the latest prompt
        add_prompt_as_message(
            prompt, aiconfig, completion_params["messages"], params
        )
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_deserialize_complete",
                __name__,
                {"output": completion_params},
            )
        )
        return completion_params


def refine_chat_completion_params(model_settings, aiconfig, prompt):
    # completion parameters to be used for openai's chat w/ vision completion api
    # system prompt handled separately
    # streaming handled separately.
    # Messages array built dynamically and handled separately
    supported_keys = {
        "frequency_penalty",
        "logit_bias",
        "max_tokens",
        "model",
        "messages",
        "n",
        "presence_penalty",
        "stop",
        "stream",
        "temperature",
        "top_p",
        "user",
    }

    completion_data = {}
    for key in supported_keys:
        if key in model_settings:
            completion_data[key] = model_settings[key]

    # Explicitly set the model to use if not already specified
    if completion_data.get("model") is None:
        model_name = aiconfig.get_model_name(prompt)
        completion_data["model"] = model_name

    # Default max tokens is too low to be useful in most cases. Manually default to 100
    if completion_data.get("max_tokens") is None:
        completion_data["max_tokens"] = 100

    return completion_data


def add_prompt_as_message(
    prompt: Prompt, aiconfig: "AIConfigRuntime", messages: List, params=None
):
    """
    Converts a given prompt to a message and adds it to the specified messages list.

    Note:
    - If the prompt contains valid input, it's treated as a user message.
    - If the prompt has a custom role or name, these attributes are included in the message.
    - If an AI model output exists, it is appended to the messages list.
    """
    # Prompt input should only ever be associated with user message in the config
    # Assistant is output, system is in prompt model metadata
    # Tools and functions are not currently supported by the sdk

    # Construct content in the form of Iterable[ChatCompletionContentPartParam]]
    # in all cases, even if the prompt is just a string with no attachments
    content_parts = []
    if isinstance(prompt.input, str):
        content_parts.append(
            {
                "type": "text",
                "text": resolve_prompt_string(
                    prompt, params, aiconfig, prompt.input
                ),
            }
        )
    else:
        if prompt.input.data:
            content_parts.append(
                {
                    "type": "text",
                    "text": resolve_prompt_string(
                        prompt, params, aiconfig, prompt.input.data
                    ),
                }
            )
        if prompt.input.attachments:
            for attachment in prompt.input.attachments:
                content_parts.append(
                    {
                        "type": "image_url",
                        "image_url": {"url": attachment.data.value},
                    }
                )
    if len(content_parts) > 0:
        messages.append({"content": content_parts, "role": "user"})

    output = aiconfig.get_latest_output(prompt)
    if output:
        if output.output_type == "execute_result":
            assert isinstance(output, ExecuteResult)
            output_data = output.data
            role = output.metadata.get("role", None) or (
                "raw_response" in output.metadata
                and output.metadata["raw_response"].get("role", None)
            )

            # Chat w/ vision does not support tool or function calls so output
            # should only be assistant role. Just check to be safe
            if role == "assistant":
                output_message = {}
                content: Union[str, None] = None
                if isinstance(output_data, str):
                    content = output_data
                elif isinstance(output_data, OutputDataWithValue):
                    if isinstance(output_data.value, str):
                        content = output_data.value
                output_message["content"] = content
                output_message["role"] = role

                name = output.metadata.get("name", None) or (
                    "raw_response" in output.metadata
                    and output.metadata["raw_response"].get("name", None)
                )
                if name is not None:
                    output_message["name"] = name

                messages.append(output_message)

    return messages
