---
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Usage Guide

`aiconfig`s can be used in an application programmatically using the SDK, and can be created and edited with a notebook-like playground called an AI Workbook. In this guide we'll go through some of the most important pieces of AIConfig.

## Anatomy of AIConfig

### What's stored in an `aiconfig`

`aiconfig` helps you track the _signature_ of generative AI model behavior:

- **model** to run inference (e.g. gpt-4, llama2)
- **model parameters** to tune the model behavior (e.g. temperature)
- **prompts**
- **outputs** cached from previous inference runs, which can be serialized optionally.

## AIConfig Setup

```
from aiconfig import AIConfigRuntime
```

To use AIConfig, you can either create a new configuration from scratch or load a pre-existing one from disk.

```
config = AIConfigRuntime.create("MyAIConfig")
```

```
config.load("path/to/your/config")
```

## Adding Prompts to an AIConfig

The most straightforward way to add prompts to the config is by serializing data into the config's format.

Take a look at this sample API call to OpenAI:

```python
openai.Chat.completions.create(**{
'top_p': 1,
'temperature': 1,
'model': 'gpt-3.5-turbo',
'messages': [{'content': 'Tell me 10 fun attractions to do in NYC.','role': 'user'}]
})
```

You can convert this into a prompt using the `serialize` method, and then add the resulting prompts to the `AIConfig`:

```python
data = {
	'top_p': 1,
	'temperature': 1,
	'model': 'gpt-3.5-turbo',
	'messages': [
					{'content': 'Tell me 10 fun attractions to do in NYC.','role': 'user'}
				]
}

serialized_prompts = await config.serialize("gpt-3.5-turbo",data, prompt_name="get_activities")
new_prompt = serialized_prompts[0]

config.add_prompt(new_prompt.name, new_prompt)
```

Users also have the option to serialize multiple prompts at once:

```python
data = {
	'top_p': 1,
	'temperature': 1,
	'model': 'gpt-3.5-turbo',
	'messages': [
					{'content': 'Tell me a riddle about apples','role': 'user'},
					{'content': "I am eaten, I am red, A fruit that keeps the doctor fed, What am I?", "role": "assistant"}
					{'content': 'Say this riddle','role': 'user'}
				]
}

# serialize can return multiple prompts
serialized_prompts = await config.serialize("gpt-3.5-turbo",data, prompt_name="riddle")

# Prompt names before the last get named sequentially. riddle_1.
# The last prompt gets named 'prompt_name' riddle. Modify prompt.name as necessary
prompt_1, prompt_2 = serialized_prompts

config.add_prompt(prompt_1.name, prompt_1)
config.add_prompt(prompt_2.name, prompt_2)
```

## Running Prompts

AIConfig's `run()` method simplifies running your prompts.

The following commands are demonstrated with a the AIConfig `travel.aiconfig.json` from the getting started page.

### Run a Prompt

```
result = await config.run(prompt_name="get_activities")
```

##### Get Output Text

A Model parser can interpret the output format of `aiconfig`. You can easily extract output text from the config as follows:

```python
response_text = config.get_output_text("get_activities")
print(response_text)
```

### Run with Streaming enabled

Unless configured otherwise in a prompt's settings, streaming is enabled by default. Two steps are needed to set up streaming at the user level:

Step 1. Define a streaming callback

```python
def  print_openai_stream(data, accumulated_data, index: int):
	"""
	Stream Callback function that prints the OpenAI stream chunks to the	stdout.
	"""
	if  "content"  in data:
		content = data['content']
		if content:
			print(content, end = "", flush=True)
```

Step 2. Construct Inference Options with your stream callback

```python
from aiconfig import InferenceOptions
inference_options = InferenceOptions(stream_callback = print_openai_stream, stream = True  )
```

You can then pass these inference options to the `run` step:

```python
await config.run(prompt_name = "get_activities", options = inference_options)
```

### Run With Chat Context

Some Model Parsers support chat context, aka, chat history. To make use of this feature, run a prompt after another that uses the same Model Parser.

```python
await config.run(prompt_name="get_activities", options=inference_options)
await config.run(prompt_name="gen_itinerary", options=inference_options)
```

### Parameterized Prompt Chains

You can specify parameterized prompt chains in your config. This will allow you to run a prompt and all its dependencies in sequence. For more information on prompt chains, refer to the Parameter Chains section: #

```python
config.load("travel.aiconfig.json")
await config.run("gen_itinerary", run_with_dependencies=True)
```

## Using an AIConfig Extension

#### Install The Extension

You can find existing extensions in the [extensions folder](https://github.com/lastmile-ai/aiconfig/tree/main/extensions) of the AIConfig repo

```
pip install aiconfig-extension-<extension>
```

#### Register Model Parser to Model Parser Registry

```python
from aiconfig import ModelParserRegistry
from aiconfig-extension-<extension> import ModelParser
parser = new ModelParser()
ModelParserRegistry.register_model_parser(parser) # Optional
```

In your config metadata, make sure to set the corresponding model parser to your model id.

```json
{
	metadata: {
		model_parsers: {
			model_id: model_parser_id
		}
	}
}
```

## Debugging with Resolve

You can examine the completion parameters of the Inference Step without actually executing it

```
resolved = await config.resolve(prompt_name="get_activities")
```

Output:

```
{
'top_p': 1,
'temperature': 1,
'model': 'gpt-3.5-turbo',
'messages': [{'content': 'Tell me 10 fun attractions to do in NYC.', 'role': 'user'}, {'content': 'Tell me a riddle about apples', 'role': 'user'}, {'content': "Sure! Here's a riddle about apples:\n\nI can be red, green, or yellow,\nRound, crunchy, and sometimes mellow.\nI grow on trees, both big and small,\nA staple fruit enjoyed by all.\nWhat am I?", 'role': 'assistant'}]
}
```

## Events And Callbacks

Events occur regularly within the AIConfig SDK. By default, AIConfig Runtime initiates with a logger callback that records all events in 'aiconfig.log'.

You can register additional callback handlers to deal with specific events.

### Creating a Custom Handler

```python
from aiconfig import AIConfigRuntime, CallbackEvent, CallbackManager

async def  my_custom_callback(event: CallbackEvent)  ->  None:
	print(f"Event triggered: {event.name}", event)
```

#### Logging Callback

AIConfig includes a bundled function that returns a customisable logger callback:

```python
from aiconfig import create_logging_callback
logging_callback = create_logging_callback('my_log.log')
```

### Register callback handler

```python
from aiconfig import AIConfigRuntime, CallbackEvent, CallbackManager
config = AIConfigRuntime.load('aiconfig.json')

callback_manager = CallbackManager([create_logging_callback, my_custom_callback])
config.set_callback_manager(callback_manager)
```

With your callback handlers in place, running a prompt will generate logs to a file, and print them to the stdout:
`await config.run("get_activities")`

```
INFO:my-logger:Callback called. event : name='on_run_start' file='aiconfig.Config' data={'prompt_name': 'get_activities', 'params': None, 'options': None, 'kwargs': {}} ts_ns=1700224729120381092
INFO:my-logger:Callback called. event : name='on_run_start' file='aiconfig.default_parsers.openai' data={'prompt': Prompt(name='get_activities', input='Tell me 10 fun attractions to do in NYC.', metadata=PromptMetadata(model=ModelMetadata(name='gpt-3.5-turbo', settings={'top_p': 1, 'temperature': 1, 'model': 'gpt-3.5-turbo'}), tags=None, parameters={}, remember_chat_context=True), outputs=[]), 'options': None, 'parameters': {}} ts_ns=1700224729120381092
INFO:my-logger:Callback called. event : name='on_deserialize_start' file='aiconfig.default_parsers.openai' data={'prompt': Prompt(name='get_activities', input='Tell me 10 fun attractions to do in NYC.', metadata=PromptMetadata(model=ModelMetadata(name='gpt-3.5-turbo', settings={'top_p': 1, 'temperature': 1, 'model': 'gpt-3.5-turbo'}), tags=None, parameters={}, remember_chat_context=True), outputs=[]), 'params': {}} ts_ns=1700224729120381092
INFO:my-logger:Callback called. event : name='on_deserialize_complete' file='aiconfig.default_parsers.openai' data={'output': {'top_p': 1, 'temperature': 1, 'model': 'gpt-3.5-turbo', 'messages': [{'content': 'Tell me 10 fun attractions to do in NYC.', 'role': 'user'}]}} ts_ns=1700224729120381092
INFO:my-logger:Callback called...
```

### Visually

<p align="center">
<video controls height="480" width="800">
    <source src="https://github.com/lastmile-ai/aiconfig/assets/81494782/d826b872-eab6-4245-91dc-96a509b4f5ec"/>
  </video>
</p>

## Editing an `aiconfig` Programmatically

## Customizing behavior

## Config File

## SDK

## FAQs

### Is the `aiconfig` json file meant to be edited by hand?

For quick updates (like changing a prompt string slightly, or changing a model parameter value), it should be ok to edit the `aiconfig` JSON manually.

But for proper editing, it should be done either programmatically via AIConfig SDK, or via the AI Workbooks editor.

1. Editing with SDK
   See the [editing `aiconfig`](#programmatically) section, and this [example cookbook](https://github.com/lastmile-ai/aiconfig/blob/main/cookbooks/Create-AIConfig-Programmatically/create_aiconfig_programmatically.ipynb).
2. Editing with UI

In the Jupyter world, an `ipynb` is a JSON file, but it's very rare to edit the JSON directly. Most people use the notebook editor which serializes updates into the `ipynb`.

Using an AI Workbook with an `aiconfig` is analogous. See the [editing visually](#visually) section for more details.
```
