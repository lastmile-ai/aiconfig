"""
wrapper around openai.ChatCompletion.create that will serialize prompts and save them to config 

usage:

    Normal Import:
        ` import openai`

    Modified:
        ```
        import openai 
        
        from aiconfig.ChatCompletion import create_and_save_to_config
        openai.ChatCompletion.create = create_and_save_to_config('my-aiconfig.json')
        ```
"""
import asyncio
import copy
import types
from typing import Dict, List, Optional

import nest_asyncio
import openai
from aiconfig.Config import AIConfigRuntime
from aiconfig.default_parsers.openai import multi_choice_message_reducer

from aiconfig.schema import ExecuteResult, Output, Prompt

openai_chat_completion_create = openai.chat.completions.create


def create_and_save_to_config(
    config_file_path: Optional[str] = None, aiconfig: Optional[AIConfigRuntime] = None
):
    """
    Overrides OpenAI's ChatCompletion.create method to serialize prompts and save them along with their outputs to a configuration file.

    Args:
        file_path (str, optional): Path to the configuration file.
        aiconfig (AIConfigRuntime, optional): An instance of AIConfigRuntime to be used.

    Returns:
        A modified version of the OpenAI ChatCompletion.create function, with additional logic to handle prompt serialization and configuration saving.
    """
    if aiconfig is None:
        try:
            aiconfig = AIConfigRuntime.load(config_file_path)
        except:
            aiconfig = AIConfigRuntime.create()

    def _create_chat_completion_with_config_saving(*args, **kwargs):
        response = openai_chat_completion_create(*args, **kwargs)

        serialized_prompts = async_run_serialize_helper(aiconfig, kwargs)

        # serialize output from response
        outputs = []

        # Check if response is a stream
        stream = kwargs.get("stream", False) is True and isinstance(response, openai.Stream)

        # Convert Response to output for last prompt
        if not stream:
            outputs = extract_outputs_from_response(response)

            # Add outputs to last prompt
            serialized_prompts[-1].outputs = outputs

            validate_and_add_prompts_to_config(serialized_prompts, aiconfig)

            # Save config to file
            aiconfig.save(config_file_path, include_outputs=True)

            # Return original response
            return response
        else:
            # If response is a stream, build the output as the stream iterated through. do_logic() becomes a generator.

            def generate_streamed_response():
                stream_outputs = {}
                messages = {}
                for chunk in response:
                    chunk_dict = chunk.model_dump(exclude_none=True)

                    # streaming only returns one chunk, one choice at a time. The order in which the choices are returned is not guaranteed.
                    messages = multi_choice_message_reducer(messages, chunk_dict)

                    for i, choice in enumerate(chunk_dict["choices"]):
                        index = choice.get("index")
                        accumulated_message_for_choice = messages.get(index, {})
                        output = ExecuteResult(
                            **{
                                "output_type": "execute_result",
                                "data": copy.deepcopy(accumulated_message_for_choice),
                                "execution_count": index,
                                "metadata": {"finish_reason": choice.get("finish_reason")},
                            }
                        )
                        stream_outputs[index] = output
                    yield chunk
                stream_outputs = [stream_outputs[i] for i in sorted(list(stream_outputs.keys()))]

                # Add outputs to last prompt
                serialized_prompts[-1].outputs = stream_outputs

                validate_and_add_prompts_to_config(serialized_prompts, aiconfig)

                # Save config to file
                aiconfig.save(config_file_path, include_outputs=True)

            return generate_streamed_response()

    return _create_chat_completion_with_config_saving


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
        result = await aiconfig.serialize(request_kwargs.get("model"), request_kwargs, "prompt")
        return result

    # serialize prompts from ChatCompletion kwargs
    if in_event_loop:
        nest_asyncio.apply(loop=asyncio.get_event_loop())
        serialized_prompts = asyncio.run(run_and_await_serialize())

    else:
        serialized_prompts = asyncio.run(run_and_await_serialize())
    return serialized_prompts


import openai

from typing import Any

class WrapModule:
    def __init__(self, real_module, mock_key, mock_value) -> None:
        self.real_module = real_module
        self.mock_key = mock_key
        self.mock_value = mock_value
        
    def __getattr__(self, key) -> Any:
        if key == self.mock_key:
            return self.mock_value
        else:
            return getattr(self.real_module, key)
        

    def __repr__(self):
        return f"WrapModule(\n{self.real_module},\n{self.mock_key},\n{self.mock_value})"
    
    def __str__(self) -> str:
        return repr(self)


def make_wrap_module(real_module, mock_path, mock_value):
    parts = mock_path.split(".")
    if len(parts) == 1:
        return WrapModule(real_module, parts[0], mock_value)
    else:
        first, rest = parts[0], ".".join(parts[1:])
        return WrapModule(
            real_module,
            first,
            make_wrap_module(getattr(real_module, first), rest, mock_value)
        )


def get_wrapped_openai(config_file_path):
    return make_wrap_module(
        openai, "chat.completions.create", 
        create_and_save_to_config(config_file_path=config_file_path),
    )
