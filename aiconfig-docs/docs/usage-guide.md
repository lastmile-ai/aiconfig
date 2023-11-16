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

## Using an `aiconfig`

### Resolve a prompt
Resolving a prompt will take a Prompt and its settings from the aiconfig and convert it into completion data that can be used to generate a response. This is useful for debugging and testing purposes.

```python
config.resolve(prompt = "get_activities", params = {} )
```
```typescript
config.resolve("get_activities")
```
Sample output:
```
{
 'top_p': 1,
 'temperature': 1,
 'model': 'gpt-3.5-turbo',
 'messages': [{'content': 'Tell me 10 fun attractions to do in NYC.','role': 'user'}]
}
```

### Serializing data into a prompt
The serialize steps lets you take model Completion Params and convert them To Config Prompts

Take this sample api call to openai:
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
 'messages': [{'content': 'Tell me 10 fun attractions to do in NYC.','role': 'user'}]
}
new_prompt = config.serialize("gpt-3.5-turbo",data, prompt_name="get_activities")
config.add_prompt(new_prompt.name, new_prompt)
```
```typescript
```


### Run a prompt
You can execute a single prompt using your AIConfig anytime after you've loaded your config into memory. This allows you to obtain a generated response from the model.

```python
# Example code to run a prompt
response = aiconfig_runtime.run(prompt_name="my_prompt")
print(response)
```
Sample Output: 
```
Execute Result(
  yada yada yada
)
```

AIConfig will automatically store the response in a standardized format, namely `ExecuteResult`

#### Outputs

On Run, a model parser will store the response in a standardized format, namely `ExecuteResult`. This is a dictionary like object with the following attributes:
- output_type
- execution_count
- data
- mime_type: Optional[str] = None
- metadata: Dict[str, Any]

#### Retrieving Outputs

A model parser has the option to implement method `get_output_text`. This method takes in a prompt name and optionally an output and returns the raw text response, unpacked from the Output format. If no output is specified, the last output should be returned.

To call this method from the AIConfig Runtime, simply call `get_output_text` on the runtime object.

```python
output_text = AIConfig.get_output_text(prompt_name="my_prompt")
```

#### Run a prompt chain

Check out the [prompt chaining](#prompt-chaining) section for more details.

### Passing data into a prompt template

Parameters! AIConfig supports handlebars style syntax for prompt templates. Check out the []

### Callbacks

Callback

#### Stream callbacks

Some model parsers allow you to stream the output of a prompt as it is generated. This is useful for long running prompts, or prompts that generate a lot of output. In order to use this feature, you must specify a callback function when you run the prompt.

#### Add Prompt
There are a couple ways to dyanmically add prompts to a config at runtime. The first is to construct a Prompt object.

```python
new_prompt = Prompt(name="my_prompt", input="Hello! What is the difference between an apple and a banana")
```
```typescript
const newPrompt = {name: "my prompt", input: "Hello! What is the difference between an apple and a banana?" }
```
Note: since we aren't specifiying any model settings or metadata in these prompts, make sure to update the config with a global model and metadata before running the prompt. see #Setting metadata below


### Setting metadata

`config.set_metadata``

Prompt Metadata
Global Metadata
Default Model

### Programmatically

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
