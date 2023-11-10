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

1. **Prompts as configs**: a [standardized JSON format](https://aiconfig.lastmileai.dev/docs/overview/ai-config-format) to store generative AI model settings, prompt inputs and outputs, and flexible multi-purpose metadata. This allows you to iterate on prompts and model parameters _separately from your application code_.
2. **Extensible SDK**: Python & Node SDKs to use `aiconfig` in your application code. AIConfig is designed to be **model-agnostic** and **multi-modal**, so you can extend it to work with models from any provider for any modality, including text, image and audio.
3. **AI Workbook editor**: A [notebook-like playground](https://lastmileai.dev/workbooks/clooqs3p200kkpe53u6n2rhr9) to edit `aiconfig` files visually, run prompts, tweak models and model settings, and chain things together.

> Full documentation: **[aiconfig.lastmileai.dev](https://aiconfig.lastmileai.dev/)**

## Features

Features:

- [x] **Source-control friendly** format to save prompts and model settings, which you can use for evaluation and reproducibility and simplifying your application code.
- [x] **Multi-modal and model agnostic**. Use with any model, and serialize/deserialize data from the same `aiconfig` format.
- [x] **Prompt chaining and parameterization** with [{{handlebars}}](https://handlebarsjs.com/) templating syntax.
- [x] **Streaming** supported out of the box, allowing you to get playground-like streaming in CLI, notebooks and any other interface easily.
- [x] **Notebook editor**. Use [AI Workbooks](https://lastmileai.dev/workbooks/clooqs3p200kkpe53u6n2rhr9) to visually create your `aiconfig`, and use the SDK to connect it to your application code.

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

### Table of Contents

1. Installation
2. Creating AIConfig Runtime
3. Creating and Managing Prompts
4. Updating Model Settings
5. Executing and Displaying Output
6. Saving Configuration to Disk

## 1) Installation

First, you need to install the AIConfig Tools package and any required dependencies. Use the following command to install it. :

Python

```bash
pip install python-aiconfig
```

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
