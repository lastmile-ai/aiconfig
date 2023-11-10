"""
wrapper around openai.ChatCompletion.create that will serialize prompts and save them to config 

usage:

    Normal Import:
        ` import openai`

    Modified:
        ```
        import openai 
        
        from aiconfig.ChatCompletion import create_and_save_to_config
        openai.ChatCompletion.create = create_and_save_to_config
        ```
"""

import copy
import types
from aiconfig.default_parsers.openai import multi_choice_message_reducer
from aiconfig.schema import ExecuteResult
from aiconfig.Config import AIConfigRuntime
import openai
import asyncio


file_path = None
aiconfig = None
openai_chat_completion_create = openai.ChatCompletion.create


def create_and_save_to_config(*args, **kwargs):
    global file_path, aiconfig
    response = openai_chat_completion_create(*args, **kwargs)

    if file_path is None:
        file_path = "aiconfig.json"
    if aiconfig is None:
        try:
            aiconfig = AIConfigRuntime.load(file_path)
        except:
            aiconfig = AIConfigRuntime.create()
            aiconfig.file_path = file_path

    # serialize prompts from ChatCompletion kwargs
    prompts = asyncio.run(aiconfig.serialize(kwargs.get("model"), kwargs, "prompt"))

    # serialize output from response
    outputs = []

    # Check if response is a stream
    stream = kwargs.get("stream", False) is True and isinstance(response, types.GeneratorType)

    # Convert Response to output for last prompt
    if not stream:
        outputs = extract_outputs_from_response(response)

    # Add outputs to last prompt
    prompts[-1].outputs = outputs

    # Validate and add prompts & outputs to config
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

    # Save config to file
    aiconfig.save(include_outputs=True)

    # Return original response
    return response


def extract_outputs_from_response(response):
    """
    Copied from openai.py ModelParser
    """
    outputs = []

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


def extract_outputs_from_response_stream(response):
    outputs = {}
    messages = {}
    for chunk in response:
        # streaming only returns one chunk, one choice at a time. The order in which the choices are returned is not guaranteed.
        messages = multi_choice_message_reducer(messages, chunk)

        for i, choice in enumerate(chunk["choices"]):
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
            outputs[index] = output
    outputs = [outputs[i] for i in sorted(list(outputs.keys()))]
    return outputs
