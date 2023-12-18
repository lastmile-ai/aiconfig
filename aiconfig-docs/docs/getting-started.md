---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Getting Started

AIConfig saves prompts, models and model parameters as source control friendly configs. This allows you to iterate on prompts and model parameters _separately from your application code_. Please read [AIConfig Basics](/docs/basics) to understand the motivation behind storing prompts and model parameters as configs.

**In this tutorial, we will create a customizable NYC travel itinerary using AIConfig.**

Resources: [Tutorial Source Code](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Getting-Started) | [Video Tutorial (shown below)](https://www.youtube.com/watch?v=X_Z-M2ZcpjA)

<iframe width="100%" height="444" src="https://www.youtube.com/embed/X_Z-M2ZcpjA?si=ndnz_RBV3zydL7EN&amp;" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### 1. Install

The [`aiconfig` file format](/docs/overview/ai-config-format) is best used with the AIConfig SDK. Install the SDK with any of these package managers:

<Tabs groupId="language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```bash
$ pip3 install python-aiconfig
# or using poetry: poetry add python-aiconfig
```

</TabItem>
<TabItem value="node">

```bash
$ npm install aiconfig
# or using yarn: yarn add aiconfig
```

</TabItem>
</Tabs>

### 2. Create an AIConfig

Start with a pre-built AIConfig `travel.aiconfig.json` for this tutorial. Download the AIConfig [here](https://github.com/lastmile-ai/aiconfig/blob/main/cookbooks/Getting-Started/travel.aiconfig.json).

This AIConfig was generated from this [AI Workbook](https://lastmileai.dev/workbooks/clooqs3p200kkpe53u6n2rhr9) - a notebook editor to prototype your prompt chains. The AIConfig contains a prompt chain to get a list of travel activities from an LLM and then customizes the activities based on user preferences (defined as parameters of the prompt). It also contains the specific models and model parameters for the LLMs.

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

</details>

You can create AIConfigs visually using AI Workbooks - we are releasing a local editor soon to create/edit AIConfigs!

:::caution
You need to setup your [OpenAI API key](https://platform.openai.com/api-keys) in your environment before proceeding. In your CLI, set the environment variable `export OPENAI_API_KEY=my_key`.
:::

### 3. Load the AIConfig

Create an `app.py` or `app.ts` file.

We will load the AIConfig in our app file. Make sure you have downloaded [`travel.aiconfig.json`](https://github.com/lastmile-ai/aiconfig/blob/main/cookbooks/Getting-Started/travel.aiconfig.json) and it is in the same directory as your app file.

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```python title="app.py"
from aiconfig import AIConfigRuntime, InferenceOptions

# Load the AIConfig
config = AIConfigRuntime.load('travel.aiconfig.json')
```

</TabItem>

<TabItem value="node">

```typescript title="app.ts"
import * as path from "path";
import { AIConfigRuntime, InferenceOptions } from "aiconfig";

async function travelWithGPT() {
  // Load the AIConfig. You can also use AIConfigRuntime.loadJSON({})
  const aiConfig = AIConfigRuntime.load(
    path.join(__dirname, "travel.aiconfig.json")
  );
}
```

</TabItem>
</Tabs>

### 4. Run a prompt

Run the prompt `get_activities` from the AIConfig.

This prompt generates a list of 10 activities to do in NYC and runs with gpt-3.5-turbo since that is the `default_model` for this AIConfig. You don't need to worry about how to run inference for the model; it's all handled by AIConfig. We will also enable streaming for the outputs.
<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```python title="app.py"
  from aiconfig import AIConfigRuntime, InferenceOptions

  # Load the AIConfig
  config = AIConfigRuntime.load('travel.aiconfig.json')

  # Run a single prompt (with streaming)
  inference_options = InferenceOptions(stream=True)
  await config.run("get_activities", options=inference_options)
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

  // Run a single prompt (with streaming)
  await aiConfig.run("get_activities", /*params*/ undefined, options);
}
```

</TabItem>
</Tabs>

Run `app.py` or `app.ts`. You will see the output of the `get_activities` prompt - 10 activities to do in NYC.

### 5. Run a prompt with dependencies

Run the prompt `gen_itinerary` from the AIConfig. This prompt depends on the output of `get_activities`. It also takes in parameters (user input) to determine the customized itinerary.

Let's take a closer look:

**`gen_itinerary` prompt**

```
"Generate an itinerary ordered by {{order_by}} for these activities: {{get_activities.output}}."
```

**`gen_itinerary` prompt metadata**

```json
{
  "metadata": {
    "model": "gpt-4",
    "parameters": {
      "order_by": "geographic location"
    }
  }
}
```

Observe the following:

1. The prompt depends on the output of the `get_activities` prompt.
2. It also depends on an `order_by` parameter
3. It uses **gpt-4**, whereas the `get_activities` prompt it depends on uses **gpt-3.5-turbo**.

This is a prompt chain between `gen_itinerary` and `get_activities` prompts, _as well as_ as a model chain between **gpt-3.5-turbo** and **gpt-4**.

Run the prompt `gen_itinerary`.

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```python title="app.py"
  from aiconfig import AIConfigRuntime, InferenceOptions

  # Load the AIConfig
  config = AIConfigRuntime.load('travel.aiconfig.json')

  # Run a single prompt (with streaming)
  # inference_options = InferenceOptions(stream=True)
  # await config.run("get_activities", options=inference_options)

  # Run a prompt with dependencies (with streaming)
  await config.run(
    "gen_itinerary",
    params={"order_by": "duration"},
    options=inference_options,
    run_with_dependencies=True)
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

  // Run a single prompt (with streaming)
  // await aiConfig.run("get_activities", /*params*/ undefined, options);

  // Run a prompt chain, with data passed in as params
  // This will first run get_activities with GPT-3.5, and
  // then use its output to run the gen_itinerary using GPT-4
  await aiConfig.runWithDependencies(
    "gen_itinerary",
    /*params*/ { order_by: "duration" },
    options
  );
}
```

</TabItem>
</Tabs>

:::info
Notice how simple the syntax is to perform a fairly complex task - running 2 different prompts across 2 different models and chaining one's output as part of the input of another.
:::

Run `app.py` or `app.ts`. You will see the output of the `gen_itinerary` prompt - customized itinerary in NYC.

### 6. Save the AIConfig

Save the AIConfig back to disk and serialize the outputs from the latest inference run.

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```python title="app.py"
  from aiconfig import AIConfigRuntime, InferenceOptions

  # Load the AIConfig
  config = AIConfigRuntime.load('travel.aiconfig.json')

  # Run a single prompt (with streaming)
  # inference_options = InferenceOptions(stream=True)
  # await config.run("get_activities", options=inference_options)

  # Run a prompt with dependencies (with streaming)
  await config.run(
    "gen_itinerary",
    params={"order_by": "duration"},
    options=inference_options,
    run_with_dependencies=True)

  # Save the aiconfig to disk and serialize outputs from the model run
  config.save('updated.aiconfig.json', include_outputs=True)
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

  // Run a single prompt (with streaming)
  // await aiConfig.run("get_activities", /*params*/ undefined, options);

  // Run a prompt chain, with data passed in as params
  // This will first run get_activities with GPT-3.5, and
  // then use its output to run the gen_itinerary using GPT-4
  await aiConfig.runWithDependencies(
    "gen_itinerary",
    /*params*/ { order_by: "duration" },
    options
  );

  // Save the AIConfig to disk, and serialize outputs from the model run
  aiConfig.save(
    "updated.aiconfig.json",
    /*saveOptions*/ { serializeOutputs: true }
  );
}
```

</TabItem>
</Tabs>

Run `app.py` or `app.ts`. You will see `updated.aiconfig.json` in your current directory with the outputs of your latest model runs.

:::note
The AIConfig SDK supports [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) operations for prompts, models, parameters, and arbitrary metadata in the `aiconfig`.

<!-- For more details, see the [SDK Overview](/docs/category/sdk). -->

:::

### 7. Edit the AIConfig in Notebook Editor

We can iterate on an `aiconfig` using an **AI Workbook** - a notebook editor to prototype your prompt chains. Now that we have an `aiconfig` file artifact that encapsulates the generative AI part of our application, the application code doesn't need to change even as the `aiconfig` is updated.

1. Go to https://lastmileai.dev.
2. Go to Workbooks page: https://lastmileai.dev/workbooks
3. Click dropdown from '+ New Workbook' and select 'Create from AIConfig'
4. Upload `travel.aiconfig.json`

Try out the AI Workbook for this tutorial: **[NYC Travel Workbook](https://lastmileai.dev/workbooks/clooqs3p200kkpe53u6n2rhr9)**

<iframe width="100%" height="444" src="https://github.com/lastmile-ai/aiconfig/assets/81494782/5d901493-bbda-4f8e-93c7-dd9a91bf242e" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

:::note
We are working on a local editor that you can run yourself. For now, please use the hosted version on https://lastmileai.dev.
:::

## Next Steps

We have several other tutorials and examples to help get you started:

**How-to Guides**

- [Create an AIConfig from scratch](/docs/overview/create-an-aiconfig)
- [Run a prompt](/docs/overview/run-aiconfig)
- [Pass data into prompts](/docs/overview/parameters)
- [Prompt chains](/docs/overview/define-prompt-chain)
- [Callbacks and monitoring](/docs/overview/monitoring-aiconfig)

**Cookbook**

Start with these recipes and access more [here](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks):

- [OpenAI Function Calling](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Function-Calling-OpenAI)
- [CLI Chatbot](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Wizard-GPT)
- [RAG with AIConfig](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/RAG-with-AIConfig)
- [Prompt Routing](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Basic-Prompt-Routing)

## Coming Soon

- Local editor to iterate on your AIConfigs
- Evaluation interfaces: allow AIConfig artifacts to be evaluated with user-defined eval functions
- OpenAI Assistants API support
- Multi-modal ModelParsers: GPT4-V support, Whisper, HuggingFace image generation
