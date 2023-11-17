---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Getting Started

AIConfig saves prompts, models and model parameters as source control friendly configs. This allows you to iterate on prompts and model parameters _separately from your application code_.

:::tip
Please read [AIConfig Basics](/docs/basics) to understand the motivation behind storing prompts and model parameters as configs.
:::

## Installation

The [`aiconfig` file format](/docs/overview/ai-config-format) is best used with the AIConfig SDK. To install the SDK, use your favorite package manager:

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

#### Python

<Tabs groupId="package-manager" queryString defaultValue={constants.defaultPythonPackageManager} values={constants.pythonPackageManagers}>
<TabItem value="pip">

```bash
$ pip install python-aiconfig
```

</TabItem>
<TabItem value="poetry">

```bash
$ poetry add python-aiconfig
```

</TabItem>

</Tabs>

:::caution
Make sure to specify the API keys (such as `OPENAI_API_KEY`) in your environment before proceeding.
:::

## Quickstart

In this quickstart, you will create a customizable NYC travel itinerary using `aiconfig`. We will start with a pre-built AIConfig that we generated from this [AI Workbook](https://lastmileai.dev/workbooks/clooqs3p200kkpe53u6n2rhr9).

:::tip
Clone the tutorial code used below from [**here**](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Getting-Started)
:::

<p align="center">
<video controls height="480" width="800">
    <source src="https://github.com/lastmile-ai/aiconfig/assets/25641935/d3d41ad2-ab66-4eb6-9deb-012ca283ff81"/>
  </video>
</p>

### 1. Download the AIConfig.

This AIConfig `travel.aiconfig.json` contains a prompt chain to get a list of travel activities from an LLM and then customize the activities based on user preferences (defined as parameters of the prompt). It also contains the specific models and model parameters for the LLMs.

Download AIConfig [here](https://github.com/lastmile-ai/aiconfig/blob/main/cookbook/Getting-Started/travel.aiconfig.json).

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

:::tip
Don't worry if you don't understand all parts of this yet, we'll go over it in steps. We will also cover a prompt editor ([AI Workbooks](#ai-workbook-playground)) to help you create AIConfigs visually.
:::

### 2. Run the `get_activities` prompt.

You don't need to worry about how to run inference for the model; it's all handled by AIConfig. The prompt runs with gpt-3.5-turbo since that is the `default_model` for this AIConfig.
<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```typescript title="app.ts"
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

</TabItem>
<TabItem value="python">

```python title="app.py"
from aiconfig import AIConfigRuntime, InferenceOptions

# Load the aiconfig.
config = AIConfigRuntime.load('travel.aiconfig.json')

# Run a single prompt
await config.run("get_activities")
```

</TabItem>
</Tabs>

### 3. Enable streaming for your prompt.

You can enable streaming for your prompt responses by passing in a streaming callback.

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
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

  // Run a single prompt
  await aiConfig.run("get_activities", /*params*/ undefined, options);
}
```

</TabItem>
<TabItem value="python">

```python title="app.py"
from aiconfig import AIConfigRuntime, InferenceOptions
config = AIConfigRuntime.load('travel.aiconfig.json')

# Run a single prompt (with streaming)
inference_options = InferenceOptions(stream=True)
await config.run("get_activities", options=inference_options)
```

</TabItem>
</Tabs>

### 4. Run the `gen_itinerary` prompt.

This prompt depends on the output of `get_activities`. It also takes in parameters (user input) to determine the customized itinerary.

Let's take a closer look:

**`gen_itinerary` prompt:**

```
"Generate an itinerary ordered by {{order_by}} for these activities: {{get_activities.output}}."
```

**prompt metadata:**

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

Effectively, this is a prompt chain between `gen_itinerary` and `get_activities` prompts, _as well as_ as a model chain between **gpt-3.5-turbo** and **gpt-4**.

Let's run this with AIConfig:

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

Replace the `aiconfig.run` call above with this:

```typescript
// Run a prompt chain, with data passed in as params
// This will first run get_activities with GPT-3.5, and
// then use its output to run the gen_itinerary using GPT-4
await aiConfig.runWithDependencies(
  "gen_itinerary",
  /*params*/ { order_by: "duration" },
  options
);
```

</TabItem>
<TabItem value="python">

Replace `config.run` above with this:

```python
inference_options = InferenceOptions(stream=True)
await config.run(
    "gen_itinerary",
    params={"order_by": "duration"},
    options=inference_options,
    run_with_dependencies=True)
```

</TabItem>
</Tabs>

:::info
Notice how simple the syntax is to perform a fairly complex task - running 2 different prompts across 2 different models and chaining one's output as part of the input of another.
:::

### 5. Save the AIConfig.

Let's save the AIConfig back to disk, and serialize the outputs from the latest inference run as well:

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```typescript
// Save the AIConfig to disk, and serialize outputs from the model run
aiConfig.save(
  "updated.aiconfig.json",
  /*saveOptions*/ { serializeOutputs: true }
);
```

</TabItem>
<TabItem value="python">

```python
# Save the aiconfig to disk. and serialize outputs from the model run
config.save('updated.aiconfig.json', include_outputs=True)
```

</TabItem>
</Tabs>

:::note
The AIConfig SDK supports [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) operations for prompts, models, parameters, and arbitrary metadata in the `aiconfig`.

<!-- For more details, see the [SDK Overview](/docs/category/sdk). -->

:::

### 6. Open the AIConfig in AI Workbook editor.

We can iterate on an `aiconfig` using a notebook-like editor called an **AI Workbook**. Now that we have an `aiconfig` file artifact that encapsulates the generative AI part of our application, the application code doesn't need to change even as the `aiconfig` is updated.

1. Go to https://lastmileai.dev.
2. Go to Workbooks page: https://lastmileai.dev/workbooks
3. Click dropdown from '+ New Workbook' and select 'Create from AIConfig'
4. Upload `travel.aiconfig.json`

Try out the workbook playground here: **[NYC Travel Workbook](https://lastmileai.dev/workbooks/clooqs3p200kkpe53u6n2rhr9)**

:::note
We are working on a local editor that you can run yourself. For now, please use the hosted version on https://lastmileai.dev.
:::

<video controls><source src="https://s3.amazonaws.com/publicdata.lastmileai.com/workbook_editor_480.mov"/></video>

```

```

### Code for Getting Started

Tutorial code can be found [here](https://github.com/lastmile-ai/aiconfig/tree/ad38040ec3d9f0273e006464e01e02b06f2809e9/cookbook/Getting-Started).

## Additional Guides

There is a lot you can do with `aiconfig`. We have several other tutorials to help get you started:

- [Create an AIConfig from scratch](/docs/overview/create-an-aiconfig)
- [Run a prompt](/docs/overview/run-aiconfig)
- [Pass data into prompts](/docs/overview/parameters)
- [Prompt chains](/docs/overview/define-prompt-chain)
- [Callbacks and monitoring](/docs/overview/monitoring-aiconfig)

### Cookbooks

- [CLI Chatbot](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Wizard-GPT)
- [RAG with AIConfig](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/RAG-with-AIConfig)
- [Prompt routing](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Basic-Prompt-Routing)
- [OpenAI function calling](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Function-Calling-OpenAI)
- [Chain of thought](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Chain-of-Verification)
