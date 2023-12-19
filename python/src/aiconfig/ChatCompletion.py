"""
wrapper around openai that will serialize prompts and save them to config 

usage: see openai_wrapper.ipynb.
"""
import asyncio
import copy
from types import ModuleType
from typing import Any, Dict, Generator, List, cast

import lastmile_utils.lib.core.api as core_utils
import nest_asyncio
import openai
from aiconfig.Config import AIConfigRuntime
from aiconfig.default_parsers.openai import multi_choice_message_reducer

from aiconfig.schema import ExecuteResult, Output, Prompt


def validate_and_add_prompts_to_config(prompts: List[Prompt], aiconfig) -> None:
    """
    Validates and adds new prompts to the AI configuration, ensuring no duplicates and updating outputs if necessary.

    Args:
        prompts (List[Prompt]): List of prompts to be validated and added.
        aiconfig (AIConfigRuntime): Configuration runtime instance to which the prompts are to be added.
    """
    for i, new_prompt in enumerate(prompts):
        in_config = False
        for config_prompt in aiconfig.prompts:
            # check for duplicates (same input and settings.)
            if (
                config_prompt.input == new_prompt.input
                and new_prompt.metadata == config_prompt.metadata
            ):
                in_config = True
                # update outputs if different
                if config_prompt.outputs != new_prompt.outputs:
                    config_prompt.outputs = new_prompt.outputs
                break
        if not in_config:
            new_prompt_name = "prompt_{}".format(str(len(aiconfig.prompts)))
            new_prompt.name = new_prompt_name
            aiconfig.add_prompt(new_prompt.name, new_prompt)


def extract_outputs_from_response(response) -> List[Output]:
    """
    Extracts outputs from the OpenAI ChatCompletion response and transforms them into a structured format.

    Args:
        response (dict): The response dictionary received from OpenAI's ChatCompletion.

    Returns:
        List[Output]: A list of outputs extracted and formatted from the response.
    """
    outputs = []

    response = response.model_dump(exclude_none=True)

    response_without_choices = {
        key: copy.deepcopy(value) for key, value in response.items() if key != "choices"
    }
    for i, choice in enumerate(response.get("choices")):
        response_without_choices.update({"finish_reason": choice.get("finish_reason")})
        output = ExecuteResult(
            **{
                "output_type": "execute_result",
                "data": choice["message"],
                "execution_count": i,
                "metadata": response_without_choices,
            }
        )

        outputs.append(output)
    return outputs


def async_run_serialize_helper(aiconfig: AIConfigRuntime, request_kwargs: Dict):
    """
    Method serialize() of AIConfig is an async method. If not, create a new one and await serialize().
    """
    in_event_loop = asyncio.get_event_loop().is_running()

    serialized_prompts = None

    async def run_and_await_serialize():
        result = await aiconfig.serialize(
            request_kwargs.get("model"), request_kwargs, "prompt"
        )
        return result

    # serialize prompts from ChatCompletion kwargs
    if in_event_loop:
        nest_asyncio.apply(loop=asyncio.get_event_loop())
        serialized_prompts = asyncio.run(run_and_await_serialize())

    else:
        serialized_prompts = asyncio.run(run_and_await_serialize())
    return serialized_prompts


# TODO type this
def create_and_save_to_config(
    output_aiconfig_ref: str | AIConfigRuntime,
    openai_api: Any | None = None,
    aiconfig_settings: dict[str, Any] | None = None,
) -> Any:
    """
    Return a drop-in replacement for openai chat completion create
    with the side effect of saving an AIConfig to the given aiconfig reference.

    output_aiconfig_ref: path to aiconfig json or an AIConfigRuntime object.
    openai_api: openai module or instance of openai.Client
    """
    if openai_api is None:
        openai_api = openai

    def _get_aiconfig_runtime(output_aiconfig_path: str) -> AIConfigRuntime:
        try:
            return AIConfigRuntime.load(output_aiconfig_path)
        except IOError:
            return AIConfigRuntime.create(**(aiconfig_settings or {}))

    output_aiconfig = (
        output_aiconfig_ref
        if isinstance(output_aiconfig_ref, AIConfigRuntime)
        else _get_aiconfig_runtime(output_aiconfig_ref)
    )

    output_config_file_path = (
        output_aiconfig_ref
        if isinstance(output_aiconfig_ref, str)
        else output_aiconfig_ref.file_path
    )

    # TODO: openai makes it hard to statically annotate.
    def _create_chat_completion_with_config_saving(*args, **kwargs) -> Any:  # type: ignore
        response = openai_api.chat.completions.create(*args, **kwargs)

        serialized_prompts = async_run_serialize_helper(output_aiconfig, kwargs)

        # serialize output from response
        outputs = []

        # Check if response is a stream
        stream = kwargs.get("stream", False) is True and isinstance(
            response, openai.Stream
        )

        # Convert Response to output for last prompt
        if not stream:
            outputs = extract_outputs_from_response(response)

            # Add outputs to last prompt
            serialized_prompts[-1].outputs = outputs

            validate_and_add_prompts_to_config(serialized_prompts, output_aiconfig)

            # Save config to file
            output_aiconfig.save(output_config_file_path, include_outputs=True)

            # Return original response
            return response
        else:
            # If response is a stream, build the output as the stream iterated through. do_logic() becomes a generator.

            # TODO: type
            def generate_streamed_response() -> Generator[Any, None, None]:
                stream_outputs = {}
                messages = {}
                for chunk in response:
                    chunk_dict = chunk.model_dump(exclude_none=True)  # type: ignore [fixme]

                    # streaming only returns one chunk, one choice at a time. The order in which the choices are returned is not guaranteed.
                    messages = multi_choice_message_reducer(messages, chunk_dict)

                    for choice in chunk_dict["choices"]:
                        index = choice.get("index")
                        accumulated_message_for_choice = messages.get(index, {})
                        output = ExecuteResult(
                            output_type="execute_result",
                            data=copy.deepcopy(accumulated_message_for_choice),
                            execution_count=index,
                            metadata={"finish_reason": choice.get("finish_reason")},
                        )
                        stream_outputs[index] = output
                    yield chunk
                stream_outputs = [
                    stream_outputs[i] for i in sorted(list(stream_outputs.keys()))
                ]

                # Add outputs to last prompt
                serialized_prompts[-1].outputs = stream_outputs

                validate_and_add_prompts_to_config(serialized_prompts, output_aiconfig)

                # Save config to file
                output_aiconfig.save(output_config_file_path, include_outputs=True)

            return generate_streamed_response()

    return _create_chat_completion_with_config_saving


def get_completion_create_wrapped_openai(
    output_aiconfig_ref: str | AIConfigRuntime,
    aiconfig_settings: dict[str, Any] | None = None,
) -> ModuleType:
    api = openai
    new_module = core_utils.make_wrap_object(
        api,
        "chat.completions.create",
        create_and_save_to_config(
            output_aiconfig_ref=output_aiconfig_ref,
            openai_api=api,
            aiconfig_settings=aiconfig_settings,
        ),
    )
    return cast(ModuleType, new_module)


def get_completion_create_wrapped_openai_client(
    output_aiconfig_ref: str | AIConfigRuntime,
    client: openai.OpenAI | None = None,
    aiconfig_settings: dict[str, Any] | None = None,
) -> openai.OpenAI:
    api = client if client is not None else openai.Client()
    wrapped = create_and_save_to_config(
        output_aiconfig_ref=output_aiconfig_ref,
        openai_api=api,
        aiconfig_settings=aiconfig_settings,
    )
    client_mocked = core_utils.make_wrap_object(api, "chat.completions.create", wrapped)

    return cast(openai.OpenAI, client_mocked)
