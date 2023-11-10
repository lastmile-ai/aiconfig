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

from aiconfig.schema import ExecuteResult
from aiconfig.Config import AIConfigRuntime
import openai
import asyncio

aiconfig = AIConfigRuntime.create("")

openai_chat_completion_create = openai.ChatCompletion.create


def create_and_save_to_config(*args, **kwargs):
    response = openai_chat_completion_create(*args, **kwargs)

    prompts = asyncio.run(aiconfig.serialize(kwargs.get("model"), kwargs))
    for i, new_prompt in enumerate(prompts):
        in_config = False
        for config_prompt in aiconfig.prompts:
            # check for duplicates (same input and settings.)
            if (
                config_prompt.input == new_prompt.input
                and new_prompt.metadata == config_prompt.metadata
            ):
                in_config = True
                break
        if not in_config:
            new_prompt_name = "prompt_{}".format(str(len(aiconfig.prompts)))
            new_prompt.name = new_prompt_name
            aiconfig.add_prompt(new_prompt.name, new_prompt)
    aiconfig.save(include_outputs=False)

    return response
