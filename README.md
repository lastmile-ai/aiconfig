<div align="center"><picture>
  <img alt="aiconfig" src="aiconfig-docs/static/img/readme_logo.png">
</picture></div>
<br/>

![Python](https://github.com/lastmile-ai/aiconfig/actions/workflows/pr_python.yml/badge.svg)
![Node](https://github.com/lastmile-ai/aiconfig/actions/workflows/pr_typescript.yml/badge.svg)
![Docs](https://github.com/lastmile-ai/aiconfig/actions/workflows/test-deploy-docs.yml/badge.svg)

<!-- <div align="right"><a href="https://aiconfig.lastmileai.dev">Go to Docs</a></div> -->

## Overview

AIConfig is a source-control friendly way to manage prompts and model parameters for generative AI.

1. **Prompts as configs**: a [standardized JSON format](https://aiconfig.lastmileai.dev/docs/overview/ai-config-format) to store generative AI model settings, prompt inputs/outputs, and flexible metadata. This allows you to iterate on prompts and model parameters _separately from your application code_.
2. **Model-agnostic SDK**: Python & Node SDKs to use `aiconfig` in your application code. AIConfig is designed to be **model-agnostic** and **multi-modal**, so you can extend it to work with any generative AI model, including text, image and audio.
3. **AI Workbook editor**: A [notebook-like playground](https://lastmileai.dev/workbooks/clooqs3p200kkpe53u6n2rhr9) to edit `aiconfig` files visually, run prompts, tweak models and model settings, and chain things together.

> Full documentation: **[aiconfig.lastmileai.dev](https://aiconfig.lastmileai.dev/)**

## Features

- [x] **Source-control friendly** [`aiconfig` format](https://aiconfig.lastmileai.dev/docs/overview/ai-config-format) to save prompts and model settings, which you can use for evaluation, reproducibility and simplifying your application code.
- [x] **Multi-modal and model agnostic**. Use with any model, and serialize/deserialize data with the same `aiconfig` format.
- [x] **Prompt chaining and parameterization** with [{{handlebars}}](https://handlebarsjs.com/) templating syntax, allowing you to pass dynamic data into prompts (as well as between prompts).
- [x] **Streaming** supported out of the box, allowing you to get playground-like streaming wherever you use `aiconfig`.
- [x] **Notebook editor**. [AI Workbooks editor](https://lastmileai.dev/workbooks/clooqs3p200kkpe53u6n2rhr9) to visually create your `aiconfig`, and use the SDK to connect it to your application code.

## Install

Install with your favorite package manager for Node or Python.

### Node.js

#### `npm` or `yarn`

```bash
npm install aiconfig
```

```bash
yarn add aiconfig
```

### Python

#### `pip` or `poetry`

```bash
pip install python-aiconfig
```

```bash
poetry add python-aiconfig
```

[Detailed installation instructions](https://aiconfig.lastmileai.dev/docs/introduction/getting-started/#installation).

## Getting Started

### Your first AIConfig

> **Note**: Make sure to specify the API keys (such as `OPENAI_API_KEY`) in your environment before proceeding.

In this quickstart, you will create a customizable NYC travel itinerary using `aiconfig`.

This AIConfig contains a prompt chain to get a list of travel activities from an LLM and then customize the activities based on user preferences.

#### 1. Download `travel.aiconfig.json`

```json
{
  "name": "NYC Trip Planner",
  "description": "Intrepid explorer with ChatGPT and AIConfig",
  "schema_version": "latest",
  "metadata": {
    "models": {
      "gpt-3.5-turbo": {
        "model": "gpt-3.5-turbo",
        "top_p": 1,
        "temperature": 1
      },
      "gpt-4": {
        "model": "gpt-4",
        "max_tokens": 3000,
        "system_prompt": "You are an expert travel coordinator with exquisite taste."
      }
    },
    "default_model": "gpt-3.5-turbo"
  },
  "prompts": [
    {
      "name": "get_activities",
      "input": "Tell me 10 fun attractions to do in NYC."
    },
    {
      "name": "gen_itinerary",
      "input": "Generate an itinerary ordered by {{order_by}} for these activities: {{get_activities.output}}.",
      "metadata": {
        "model": "gpt-4",
        "parameters": {
          "order_by": "geographic location"
        }
      }
    }
  ]
}
```

#### 2. Run the `get_activities` prompt.

You don't need to worry about how to run inference for the model; it's all handled by AIConfig. The prompt runs with gpt-3.5-turbo since that is the `default_model` for this AIConfig.

##### Python

```python title="app.py"
from aiconfig import AIConfigRuntime, InferenceOptions

# Load the aiconfig. You can also use AIConfigRuntime.loadJSON({})
config = AIConfigRuntime.load('travel.aiconfig.json')

# Run a single prompt
await config.run("get_activities", params=None)
```

#### 3. Enable streaming for your prompt.

You can enable streaming for your prompt responses using `InferenceOptions`.

##### Node.js

```typescript
import * as path from "path";
import { AIConfigRuntime, InferenceOptions } from "aiconfig";

async function travelWithGPT() {
  // Load the AIConfig. You can also use AIConfigRuntime.loadJSON({})
  const aiConfig = AIConfigRuntime.load(
    path.join(__dirname, "travel.aiconfig.json")
  );

  // Run a single prompt
  await aiConfig.run("get_activities");
}
```

### OpenAI Introspection API

If you are already using OpenAI completion API's in your application, you can get started very quickly to start saving the prompts and outputs in an `aiconfig`.

Simply add the following lines to your `import`:

```python
import openai
from aiconfig.ChatCompletion import create_and_save_to_config
 openai.ChatCompletion.create = create_and_save_to_config
```

Now you can continue using `openai` completion API as normal. By default, the data will get serialized to an `aiconfig.json`.

#### Specifying an AIConfig object

## Cookbooks

We provide several guides to show you the power of `aiconfig`.

> **See the [`cookbooks`](https://github.com/lastmile-ai/aiconfig/tree/main/cookbook) folder for examples to clone.**

## Roadmap

### Table of Contents

1. Installation
2. Creating AIConfig Runtime
3. Creating and Managing Prompts
4. Updating Model Settings
5. Executing and Displaying Output
6. Saving Configuration to Disk

## 2) Creating AIConfig Runtime

To start using AIConfig Tools, create an AIConfig Runtime instance. This runtime will allow you to manage prompts, model settings, and execute AI tasks. Here's how you can create it:

Python

```python
from aiconfig.Config import AIConfigRuntime
aiconfig = AIConfigRuntime.create("demo", "this is a demo AIConfig")
```

TypeScript

```typescript
import OpenAI from "openai";
import * as path from "path";
import { AIConfigRuntime } from "../lib/config";

const aiConfig = AIConfigRuntime.create("demo", "this is a demo AIConfig");
```

###### Loading an existing config is easy too.

Python

```python
from aiconfig.Config import AIConfigRuntime
aiconfig = AIConfigRuntime.from_config("/path/to/config")
```

Typescript

```typescript
import { AIConfigRuntime } from "../lib/config";
const aiConfig = AIConfigRuntime.load(
  path.join(__dirname, "/path/to/config.json")
);
```

## 3) Creating and Managing Prompts

Prompts are input messages or queries you send to a Large Language model. You can create and manage prompts using AIConfig Tools. Here's an example of creating a prompt:

Python

```python
from aiconfig.schema import ModelMetadata, Prompt

prompt = Prompt(
    name="prompt1",
    input="Hi! What are transformers?",
    metadata={
        "model": "gpt-3.5-turbo",
    }
)

aiconfig.add_prompt(prompt.name, prompt)
```

Typescript

```Typescript

```

## 4) Updating Model Settings

You can also update the settings of Large Language models, such as temperature and top-k. Here's an example of updating the model settings:

Python

```python
model_name = "gpt-3.5-turbo"
model_settings = {
    "top_k": 40,
    "top_p": 0.95,
    "model": "gpt-3.5-turbo",
    "temperature": 0.9
}

aiconfig.add_model(model_name, model_settings)
```

Typescript

```typescript

```

## 5) Executing and Displaying Output

Once you have created prompts and updated model settings, you can execute prompts and retrieve the output. Here's an example of executing a prompt and displaying the output:

Python

```python
import asyncio
parameters = {"name": "Demo"}
asyncio.run(aiconfig.run("prompt1", parameters))

latest_output = aiconfig.get_latest_output("prompt1")
output_text = aiconfig.get_output_text("prompt1", latest_output)
print(output_text)
```

Typescript

```typescript
const params = {
  name: "Demo",
};

let result = await aiConfig.run(
  "demoPrompt",
  params,
  /*options*/ {
    stream: false,
  }
);

console.log(aiConfig.getOutputText("demoPrompt"));
```

## 6) Saving Configuration to Disk

You can save your AIConfig configuration to disk for later use or to share with others. This allows you to persist your prompts, model settings, and other configurations. Here's how you can save your AIConfig configuration to a file:

Python

```python
# Save the configuration to a file
aiconfig.save_config("my_aiconfig.json")
```

Typescript

```typescript
aiConfig.save("demo/demo.aiconfig.json");
```

## More Demos

Checkout the demo folder for example configs and example python notebooks.

# aiconfig

aiconfig -- for prompt, model and parameter management

- Motivation
- Why use aiconfig
- Getting Started
- Core Components
- Capabilities
  - Version Control
  - Model parser
  - Routing
  - Evaluation
- Debugging
- Roadmap
  - Multi-modal model support (use with image, audio generation models as well as multi-modal models like GPT-V)
  - Routing
  - Evaluation
