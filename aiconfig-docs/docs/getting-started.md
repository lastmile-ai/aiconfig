---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Getting Started

AIConfig is a framework that makes it easy to build generative AI applications for production. It manages generative AI prompts and model parameters as JSON-serializable configs that can be version controlled, evaluated, and opened in a local editor for rapid prototyping. Please read [AIConfig Basics](https://aiconfig.lastmileai.dev/docs/basics/) to learn more.

## Quickstart

1. `pip3 install python-aiconfig`
2. `export OPENAI_API_KEY='your-key'`
3. `aiconfig edit`

## Getting Started Tutorial

**In this tutorial, we will create a customizable NYC travel itinerary using AIConfig.**

## Install

#### Python

<Tabs groupId="package-manager" queryString defaultValue={constants.defaultPythonPackageManager} values={constants.pythonPackageManagers}>
<TabItem value="pip">

```bash
$ pip install --user python-aiconfig
```

</TabItem>
<TabItem value="poetry">

```bash
$ poetry add python-aiconfig
```

</TabItem>

</Tabs>

#### Node.js (TypeScript)

<Tabs groupId="package-manager" queryString defaultValue={constants.defaultNodePackageManager} values={constants.nodePackageManagers}>
<TabItem value="npm">

```bash
$ npm install aiconfig
```

</TabItem>
<TabItem value="yarn">

```bash
$ yarn add aiconfig
```

</TabItem>

</Tabs>

**Note:** You need to install the python AIConfig package to create and edit your configs using the AIConfig Editor. You can still use the AIConfig Node SDK to interact with your config in your application code.

## Setup your API Key(s)

You will need to specifiy API keys for the model providers (i.e. OpenAI, Google, HuggingFace) you plan to use. We recommend adding your API keys as environment variables so that they are accessible for all projects. The python library will automatically detect and use them without you having to write any code.

For this tutorial, you will need to have an OpenAI API key that has access to GPT-4. Setup help for other API keys is available [here](https://aiconfig.lastmileai.dev/docs/editor#env-api-keys).

<details> 
    <summary> Setup your OpenAI API Key as a environment variable (MacOS / Linux / Windows)</summary>
    <div>
        1. Get your OpenAI API Key: https://platform.openai.com/account/api-keys 
        2. Open Terminal
        3. Edit Bash Profile: Use the command `nano ~/.bash_profile` or `nano ~/.zshrc` (for newer MacOS versions) to open the profile file in a text editor.
        4. Add Environment Variable: In the editor, add the line below, replacing *your-api-key-here* with your actual API key:
        ```bash 
        export OPENAI_API_KEY='your-api-key-here'
        ```
        5. *[Optional] add in environment variables for your other model providers (Google, HuggingFace, Anyscale, etc.).*
        6. Save and Exit: Press `Ctrl+O` followed by `ENTER` to write the change. Then `Ctrl+X` to close the editor.
        7. Load Your Profile: Use the command `source ~/.bash_profile` or `source ~/.zshrc` to load the updated profile.
        8. Verification: Verify the setup by typing `echo $OPENAI_API_KEY` in the terminal. It should display your API key.
    </div>

</details>

## Open AIConfig Editor

AIConfig Editor allows you to visually create and edit the prompt chains and model parameters that are stored as AIConfigs. You can also chain prompts and use global and local parameters in your prompts. Learn more about [AIConfig Editor](https://aiconfig.lastmileai.dev/docs/editor).

1. Open your Terminal
2. Run this command: `aiconfig edit --aiconfig-path=travel.aiconfig.json`

This will open AIConfig Editor in your default browser at http://localhost:8080/ and create a new AIConfig JSON file `travel.aiconfig.json` in your current directory.

![img_editor](https://github.com/lastmile-ai/aiconfig/assets/81494782/ae3188c7-2471-41d4-bb7f-9012284d9a88)

An AIConfig JSON file is generated - shown below:

<details>
<summary>`travel.aiconfig.json`</summary>

```json
{
  "name": "",
  "schema_version": "latest",
  "metadata": {
    "parameters": {},
    "models": {}
  },
  "description": "",
  "prompts": [
    {
      "name": "prompt_1",
      "input": "",
      "metadata": {
        "model": "gpt-4",
        "parameters": {}
      },
      "outputs": []
    }
  ],
  "$schema": "https://json.schemastore.org/aiconfig-1.0"
}
```

</details>

## Create an AIConfig

**1. Give your AIConfig a title and a description.**

![image2](https://github.com/lastmile-ai/aiconfig/assets/81494782/6c929c8d-1f91-4ea8-aacf-63bd985d4600)

**2. Create your first prompt `get_activities`.**

This prompt uses GPT-3.5 to generate a list of activities in NYC. Prompt is "Tell me 10 fun attractions to do in NYC". Run the prompt using the **Play** button.
![image3](https://github.com/lastmile-ai/aiconfig/assets/81494782/3463be60-cd39-4e3b-8081-eb616e8967f8)

**3. Click the Save button.**

Notice that your AIConfig JSON file updates with the prompt. Your work in AIConfig Editor will auto-save every 15 seconds but you can always manually save with the button.

**4. Create your second prompt `gen_itinerary` which depends on your first prompt.**

This prompt uses GPT-4 to generate an itinerary based on the output of our first prompt `get_activities` (chaining) and a local variable `order_by`. Local parameters are local to the prompt cell whereas global parameters can be used across prompt cells in the editor. Run the prompt using the Play button.

![img_editor](https://github.com/lastmile-ai/aiconfig/assets/81494782/73558099-b42b-48d2-bac4-3023766da5a0)

**5. Click the **Save** button.**

Notice that your AIConfig JSON file updates with the second prompt, including the chaining logic and parameters. See below:

<details>
<summary>`travel.aiconfig.json`</summary>

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
        "max_tokens": 3000
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

</details>

## Use AIConfig in your Application Code

You can execute the prompts from the AIConfig generated from Local Editor in your application code using either the python or Node SDK. In this section we will demonstrate basic features of the SDK. Please refer to the API reference documentation for more features.

**1. Create a new script `app.py` or `app.ts`.**

**2. Load your AIConfig.**

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```python title="app.py"
from aiconfig import AIConfigRuntime, InferenceOptions
import asyncio

config = AIConfigRuntime.load("travel.aiconfig.json")
```

</TabItem>

<TabItem value="node">

```typescript title="app.ts"
import * as path from "path";
import { AIConfigRuntime, InferenceOptions } from "aiconfig";

async function travelWithGPT() {
  const aiConfig = AIConfigRuntime.load(
    path.join(__dirname, "travel.aiconfig.json")
  );
}

travelWithGPT();
```

</TabItem>
</Tabs>

**3. Setup streaming for your model responses.**

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```python title="app.py"
inference_options = InferenceOptions(stream=True)
```

</TabItem>

<TabItem value="node">

```typescript title="app.ts"
async function travelWithGPT() {
  const aiConfig = AIConfigRuntime.load(
    path.join(__dirname, "travel.aiconfig.json")
  );

  const options: InferenceOptions = {
    callbacks: {
      streamCallback: (data: any, _acc: any, _idx: any) => {
        // Write streamed content to console
        process.stdout.write(data?.content || "\n");
      },
    },
  };
}

travelWithGPT();
```

</TabItem>
</Tabs>

**4. Run `get_activities` prompt from the AIConfig.**

Add these lines to your script. To see the output, open your terminal and run your script.

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```python title="app.py"
async def travelWithGPT():
  get_activities_response = await config.run("get_activities", options=inference_options)

asyncio.run(travelWithGPT())
```

</TabItem>

<TabItem value="node">

```typescript title="app.ts"
async function travelWithGPT() {
  const aiConfig = AIConfigRuntime.load(
    path.join(__dirname, "travel.aiconfig.json")
  );

  const options: InferenceOptions = {
    callbacks: {
      streamCallback: (data: any, _acc: any, _idx: any) => {
        // Write streamed content to console
        process.stdout.write(data?.content || "\n");
      },
    },
  };

  // Run a single prompt
  await aiConfig.run("get_activities", /*params*/ undefined, options);
}

travelWithGPT();
```

</TabItem>
</Tabs>

**5. Run the `gen_itinerary` prompt from the AIConfig.**

Replace the travelWithGPT() function code with these line(s). To see the output, open your terminal and run your script.

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```python title="app.py"
async def travelWithGPT():
  gen_itinerary_response = await config.run("gen_itinerary", options=inference_options, run_with_dependencies=True)

asyncio.run(travelWithGPT())
```

</TabItem>

<TabItem value="node">

```typescript title="app.ts"
async function travelWithGPT() {
  const aiConfig = AIConfigRuntime.load(
    path.join(__dirname, "travel.aiconfig.json")
  );

  const options: InferenceOptions = {
    callbacks: {
      streamCallback: (data: any, _acc: any, _idx: any) => {
        // Write streamed content to console
        process.stdout.write(data?.content || "\n");
      },
    },
  };

  // Run a prompt with dependencies
  await aiConfig.runWithDependencies(
    "gen_itinerary",
    /*params*/ { order_by: "duration" },
    options
  );
}

travelWithGPT();
```

</TabItem>
</Tabs>

You will see the model response in your terminal. Since this prompt depends on another prompt, we see the response from the `get_activities` prompt followed by the response from the `gen_itinerary` prompt.

**6. Run the `gen_itinerary` prompt with a different parameter.**

Replace the travelWithGPT() function code with these line(s). To see the output, open your terminal and run your script.

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```python title="app.py"
async def travelWithGPT():
  gen_itinerary_response = await config.run("gen_itinerary", params = {"order_by" : "location"}, options=inference_options, run_with_dependencies=True)

asyncio.run(travelWithGPT())
```

</TabItem>

<TabItem value="node">

```typescript title="app.ts"
async function travelWithGPT() {
  const aiConfig = AIConfigRuntime.load(
    path.join(__dirname, "travel.aiconfig.json")
  );

  const options: InferenceOptions = {
    callbacks: {
      streamCallback: (data: any, _acc: any, _idx: any) => {
        // Write streamed content to console
        process.stdout.write(data?.content || "\n");
      },
    },
  };

  // Run a prompt with dependencies
  await aiConfig.runWithDependencies(
    "gen_itinerary",
    /*params*/ { order_by: "location" },
    options
  );
}

travelWithGPT();
```

</TabItem>
</Tabs>

You will see the model response in your terminal. Notice how the output differs with the updated parameter.

**7. Save the aiconfig to disk and serialize outputs from the model run.**

Run your script.

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```python title="app.py"
config.save('updated_travel.aiconfig.json', include_outputs=True)
```

</TabItem>

<TabItem value="node">

```typescript title="app.ts"
async function travelWithGPT() {
  const aiConfig = AIConfigRuntime.load(
    path.join(__dirname, "travel.aiconfig.json")
  );

  const options: InferenceOptions = {
    callbacks: {
      streamCallback: (data: any, _acc: any, _idx: any) => {
        // Write streamed content to console
        process.stdout.write(data?.content || "\n");
      },
    },
  };

  // Run a prompt with dependencies
  await aiConfig.runWithDependencies(
    "gen_itinerary",
    /*params*/ { order_by: "location" },
    options
  );

  // Save and serialize outputs
  aiConfig.save(
    "updated.aiconfig.json",
    /*saveOptions*/ { serializeOutputs: true }
  );
}

travelWithGPT();
```

</TabItem>
</Tabs>

**Full Script**

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```python title="app.py"
from aiconfig import AIConfigRuntime, InferenceOptions
import asyncio

config = AIConfigRuntime.load("travel.aiconfig.json")
inference_options = InferenceOptions(stream=True)

async def travelWithGPT():
  gen_itinerary_response = await config.run("gen_itinerary", params = {"order_by" : "location"}, options=inference_options, run_with_dependencies=True)

asyncio.run(travelWithGPT())
config.save('updated_travel.aiconfig.json', include_outputs=True)
```

</TabItem>

<TabItem value="node">

```typescript title="app.ts"
import * as path from "path";
import { AIConfigRuntime, InferenceOptions } from "aiconfig";

async function travelWithGPT() {
  const aiConfig = AIConfigRuntime.load(
    path.join(__dirname, "travel.aiconfig.json")
  );

  const options: InferenceOptions = {
    callbacks: {
      streamCallback: (data: any, _acc: any, _idx: any) => {
        // Write streamed content to console
        process.stdout.write(data?.content || "\n");
      },
    },
  };

  // Run a prompt with dependencies
  await aiConfig.runWithDependencies(
    "gen_itinerary",
    /*params*/ { order_by: "location" },
    options
  );

  // Save and serialize outputs
  aiConfig.save(
    "updated.aiconfig.json",
    /*saveOptions*/ { serializeOutputs: true }
  );
}

travelWithGPT();
```

</TabItem>
</Tabs>

## Edit your AIConfig

You can iterate and edit your aiconfig using the AIConfig Editor. Now that we have an aiconfig file artifact that encapsulates the generative AI parts of our application, the application code doesn't need to change even as the aiconfig is updated.

1. Open your Terminal
2. Run this command: `aiconfig edit --aiconfig-path=updated_travel.aiconfig.json`

A new tab with the AIConfig Editor opens in your default browser at http://localhost:8080/ with the prompts, chaining logic, and settings from `updated_travel.aiconfig.json`. Your edits will auto-save every 15 seconds. You can also manually save with the Save button.

## Next Steps

Check out these examples and guides:

- [OpenAI function calling](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Function-Calling-OpenAI)
- [RAG with AIConfig](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/RAG-with-AIConfig)
- [CLI Chatbot](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Wizard-GPT)
- [Prompt routing](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Basic-Prompt-Routing)
- [Chain of thought](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Chain-of-Verification)

## Coming Soon

- Non-default model support in Local Editor
- OpenAI Assistants API support
- Multimodal ModelParsers: GPT4-V support, Whisper

## Questions or Feedback?

Join our Discord community [here](https://discord.com/invite/xBhNKTetGx)! We welcome your feedback and are here to help with any questions.
