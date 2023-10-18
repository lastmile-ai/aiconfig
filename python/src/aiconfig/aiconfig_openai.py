"""
wrapper around openai.ChatCompletion.create that will serialize prompts and save them to config 

usage:

    Normal Import:
        ` import openai`

    Modified:
        ```
        import openai 
        
        from aiconfig.aiconfig_openai import create_and_save_to_config
        openai.ChatCompletion.create = create_and_save_to_config
        ```
"""

from aiconfig.Config import AIConfigRuntime
import openai
import asyncio

aiconfig = AIConfigRuntime.create("")

original_create = openai.ChatCompletion.create


def create_and_save_to_config(*args, **kwargs):
    response =  original_create(*args, **kwargs)

    prompt = asyncio.run(aiconfig.serialize(kwargs.get("model"), kwargs))
    aiconfig.add_prompt(prompt.name, prompt)
    aiconfig.save()

    return response
