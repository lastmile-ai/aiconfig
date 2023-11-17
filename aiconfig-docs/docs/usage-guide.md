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

## Create an AIConfig

```
import aiconfig
```

You can create a config from scratch, or you can load a config from disk

```
config = AIConfigRuntime.create("MyAIConfig")
```

```
config.load("path/to/your/config")
```

## Adding Prompts to config

The easiest way to add prompts to config is by serializing data into config format.

Take a look at this sample API call to OpenAI:

```python
openai.Chat.completions.create(**{
'top_p': 1,
'temperature': 1,
'model': 'gpt-3.5-turbo',
'messages': [{'content': 'Tell me 10 fun attractions to do in NYC.','role': 'user'}]
})
```

We can convert this into a prompt using the serialize method

```python
data = {
	'top_p': 1,
	'temperature': 1,
	'model': 'gpt-3.5-turbo',
	'messages': [
					{'content': 'Tell me 10 fun attractions to do in NYC.','role': 'user'}
				]
}
# serialize Uses the Model Parser for the specified model to convert your data into a prompt
new_prompt = config.serialize("gpt-3.5-turbo",data, prompt_name="get_activities")
# Make sure to add your new prompt to your condif
config.add_prompt(new_prompt.name, new_prompt)
```

Lets serialize a  complex prompt chain

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
new_prompts = config.serialize("gpt-3.5-turbo",data, prompt_name="get_activities")
# Make sure to add your new prompt to your condif
config.add_prompt(new_prompt.name, new_prompt)
```

## Running Prompts

AIConfig's `run()` method handles most of the important logic under the hood.

### Run a Prompt

```
result = await config.run(prompt_name = "prompt1")
```

### Run with Streaming enabled

Enable Streaming.
Step 1. Define a streaming callback

```python
def print_openai_stream(data, accumulated_data, index: int):
"""
Stream Callback function that prints the OpenAI stream outputs to the stdout.
"""
if  "content"  in  data:
	content = data['content']
	if  content:
		print(content, end = "", flush=True)
```

Step 2. Instantiate Inference Options

```python
from aiconfig import InferenceOptions
inference_options = InferenceOptions(stream = True, stream_callback = print_openai_stream)
```

All set!

```python
config.run(prompt_name = "prompt1", options = InferenceOptions)
```

### Chat History

Some Model Parsers support chat context, aka, chat history. All you need to do is run a prompt that comes after another prompt that uses the same Model Parser

```python
config.run(prompt_name="prompt2", options=InferenceOptions)
```

### Prompt Chains

Define Parameterized prompt chains in your config. You can run them all at once, sequentially

```python
config.run("prompt2", run_with_dependencies =True)
```

## Using an aiconfig Extension

#### Install The Extension

```
pip install aiconfig-extension-<extension>
```

#### Register to Model Parser Registry

```python
from aiconfig import ModelParserRegistry
parser = new Parser()
ModelParserRegistry.register_model_parser(parser)
```

alternatively, set the metadata in the aiconfig json and AIConfig will register the model parser at load()

```json
{
	metadata: {
		model_parsers: {
			model_id: parser_id
		}
	}
}
```

## Debugging with Resolve

You can take a look at the completion params of Inference Step without actually executing the inference step

```
config.deserialize(prompt_name="prompt1")
```

## Events With Logging (Tracing & Monitoring

## Define logging callback, registering Callbacks

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
