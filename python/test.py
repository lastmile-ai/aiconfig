"""
import openai 

from aiconfig.ChatCompletion import create_and_save_to_config
openai.ChatCompletion.create = create_and_save_to_config
"""


import openai 

from aiconfig.ChatCompletion import create_and_save_to_config
openai.ChatCompletion.create = create_and_save_to_config


completion = openai.ChatCompletion.create(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "system", "content": "You are a poetic assistant, skilled in explaining complex programming concepts with creative flair."},
    {"role": "user", "content": "Compose a poem that explains the concept of recursion in programming."}
  ]
)


print(f'type: {type(completion)}')
print(f'completion: {completion}')


# from aiconfig import AIConfigRuntime
# import asyncio
# config = AIConfigRuntime.load('aiconfig.json')
# result = asyncio.run(config.run('prompt_0'))
# print(result)