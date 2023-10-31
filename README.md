# AIConfig Tools: Configuring and Interacting AIConfigs

## Overview

AIConfig Tools is a package that simplifies Prompt, Model, and Parameter Management by allowing you to create and manage AIConfigs.

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
from aiconfig.AIConfigSettings import ModelMetadata, Prompt

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

## AIConfig Schema
```json
{
  "name": "Friendly name descriptor",
  "description": "Optional description",
  "schema_version": "semver-based versioning of the aiconfig schema",
  "metadata": {
    "parameters": {
      "param1": "Parameter to use within the prompts. Adheres to handlebar syntax (i.e. can be referenced as {{param1}}.",
      "param2": "value2"
    },
    "default_model": "ID of a default model to use for prompts that don't specify a model themselves (e.g. 'llama2').",
    "models": {
      "gpt-4": {
        "temperature": 0.75,
        "optional-model-settings": "Optional model parameters to configure (e.g. temperature, tokens, top_k, etc.)"
      }
    }
  },
  "prompts": [
    {
      "name": "Unique identifier to reference this prompt by (e.g. 'prompt_1').",
      "input": "Input text for the first prompt. Prompts can reference parameters, such as {{param1}} or {{param2}}",
      "metadata": {
        "model": {
          "name": "gpt-4 (inherits settings from the global metadata as well)",
          "settings": {
            "optional-local-model-param1": "Model parameter overrides for this prompt.",
            "temperature": 1.0
          },
          "parameters": {
            "param1": "Parameter overrides for this prompt.",
            "param3": "value3"
          }
        }
      }
    },
    {
      "name": "prompt_2",
      "input": "Input text for second prompt. Prompts can reference context from previous prompts, such as {{prompt1.output}} or {{prompt1.input}}"
    }
  ]
}
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
