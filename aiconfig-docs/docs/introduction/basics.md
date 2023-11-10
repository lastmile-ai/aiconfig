---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# What is AIConfig

AIConfig is a source-control friendly way to manage your prompts, models and model parameters as configs. It allows you to store and iterate on generative AI model behavior _separately from your application code_.

AIConfig has 3 foundations:

1. **[`aiconfig` file format](/docs/overview/ai-config-format)**: a standardized JSON format to store generative AI model settings, prompt inputs and outputs, and flexible multi-purpose metadata.
2. **[AIConfig SDK](/docs/introduction/getting-started)**: Python and Node SDKs to use `aiconfig` in your application code, and extension points to customize behavior.
3. **[AI Workbook editor](https://lastmileai.dev/workbooks/clm7b9yez00mdqw70majklrmx)**: A notebook-like playground to edit `aiconfig` files visually, run prompts, tweak models and model settings, and chain things together.

AIConfig is **multi-modal** and **model-agnostic**. This enables powerful interop between different models and modalities, including chaining them together (see [prompt chaining](/docs/overview/parameters-and-chaining)). For example, a Whisper (speech-to-text) prompt can be connected to a GPT4-V prompt (image+text-to-text) to build complex AI applications, all backed by the same `aiconfig` serialization format.

## Prompts as configs

Unlike traditional _predictive_ ML development undertaken largely by ML researchers, generative AI applications are being developed collaboratively by software engineers.

Separating prompt management from application development leads to a few powerful consequences:

1. **Separation of concerns**: You can iterate on prompts and models separately from application code -- and different people could be responsible for them, making the overall development more collaborative.
2. **Notebook editor for prompts**: Having prompts and models in one place allows a notebook-like editor environment to iterate on the aiconfig. This greatly increases the velocity of prototyping and iteration.
3. **Governance**: As a source-controlled artifact, `aiconfig` can be used for reproducability and provenance of the generative AI bits of your application.

## Example

:::tip

See the [Getting Started](/docs/introduction/getting-started) guide for a more detailed overview, and spend time getting familiar with the [`aiconfig` file format](/docs/overview/ai-config-format).

:::

Suppose we have the following prompts to help us plan a trip to New York. As you'll see, using this `aiconfig` in application code is trivial. The application no longer needs to know _how_ to invoke different models -- it simply uses `config.run(prompt_name)` to do so. There's a lot you can do with AIConfig, which we'll get into in later guides.

### `aiconfig` file format

<details>
<summary>`travel.aiconfig.json` - Use GPT-3.5 to plan a trip to New York</summary>
```json
{
  "name": "Planning a trip to New York",
  "description": "Exploring NYC through ChatGPT and AIConfig",
  "schema_version": "latest",
  "metadata": {
    "models": {
      "gpt-3.5-turbo": {
        "model": "gpt-3.5-turbo",
        "top_p": 1,
        "temperature": 1
      }
    }
  },
  "prompts": [
    {
      "name": "get_activities",
      "input": "Tell me 10 fun attractions to do in NYC."
      "metadata": {
        "model": "gpt-3.5-turbo",
      }
    }  
  ]
}
```

</details>

### Using with AIConfig SDK

Creating an application with this `aiconfig` is trivial. The application no longer needs to know _how_ to invoke different models, how to handle streaming, etc. -- it simply uses `config.run(prompt_name)` and the AIConfig SDK does the rest.

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```bash
$ yarn add aiconfig
```

```bash
$ set OPENAI_API_KEY=sk_xxxx
```

```typescript title="app.ts"
import * as path from "path";
import { AIConfigRuntime, InferenceOptions } from "aiconfig";

async function travelWithGPT() {
  // Load the aiconfig. You can also use AIConfigRuntime.loadJSON({})
  const aiConfig = AIConfigRuntime.load(
    path.join(__dirname, "travel.aiconfig.json")
  );

  // Run a single prompt
  await aiConfig.run("get_activities", /*params*/ undefined, options);

  // Save the AIConfig to disk, and serialize outputs from the model run
  aiConfig.save(
    "updated.aiconfig.json",
    /*saveOptions*/ { serializeOutputs: true }
  );
}
```

</TabItem>
<TabItem value="python">
```bash
$ pip install python-aiconfig
````

```bash
$ set OPENAI_API_KEY=sk_xxxx
```

```python title="app.py"
from aiconfig import AIConfigRuntime, InferenceOptions

# Load the aiconfig. You can also use AIConfigRuntime.loadJSON({})
config = AIConfigRuntime.load('travel.aiconfig.json')

# Run a single prompt (with streaming)
inference_options = InferenceOptions(stream=True)
await config.run("get_activities", params=None, inference_options)

# Save the aiconfig to disk. and serialize outputs from the model run
config.save('updated.aiconfig.json', include_output=True)
```

</TabItem>
</Tabs>

### AI Workbook playground

Now that we have an `aiconfig` file artifact that encapsulates the generative AI part of our application, we can iterate on it using a notebook editor. The application code doesn't need to change even as the `aiconfig` is updated.

:::note
We are currently working on a local editor that you can run yourself. For now, please use the hosted version on https://lastmileai.dev.
:::

<video controls><source src="https://s3.amazonaws.com/publicdata.lastmileai.com/workbook_editor_480.mov"/></video>

:::tip
Try out this workbook yourself here: **[NYC Travel Workbook](https://lastmileai.dev/workbooks/clooqs3p200kkpe53u6n2rhr9)**
:::

## Improved AI Governance

`aiconfig` helps you track the _signature_ of generative AI model behavior:

- **prompts** and prompt chains that constitute the input (can be text, image or any modality)
- **model** to run inference (can be any model from any model provider)
- **model parameters** to tune the model behavior
- **outputs** cached from previous inference runs, which can be serialized optionally.

Having a dedicated source-controlled artifact for generative AI helps with reproducibility, evaluation and rapid iteration. You can iterate on this artifact, evaluate it and integrate it into the rest of your application development workflow.

## Parallels to Jupyter

As you go through AIConfig, you may notice similarities to [Jupyter](https://jupyter-notebook.readthedocs.io/) notebooks and its storage format, [`ipynb`](https://ipython.org/ipython-doc/3/notebook/nbformat.html). This is by design.

_**AI Workbooks are to AIConfig what Jupyter notebooks are to `ipynb`**_

We believe that notebooks are a perfect iteration environment for generative AI -- they are flexible, multi-modal, and collaborative.

The multi-modality and flexibility offered by notebooks and `ipynb` offers a good interaction model for generative AI. The `aiconfig` file format is extensible like `ipynb`, and AI Workbook editor allows rapid iteration in a notebook-like IDE.

There are 2 areas where we are going beyond what notebooks offer:

1. `aiconfig` is more **source-control friendly** than `ipynb`. `ipynb` stores binary data (images, etc.) by encoding it in the file, while `aiconfig` recommends using file URI references instead.
2. `aiconfig` can be imported and **connected to application code** using the AIConfig SDK.

## Extensibility

AIConfig is meant to be fully customizable and extensible for your use-cases. The specific parts that you can customize include:

- **Model Parsers**: these parsers are responsible for deciding how to run inference, what data to store in the `aiconfig`, and how. You can add model parsers for any model of any input/output modality, and from any provider (including a model running on your local machine).
- **Callbacks**: callback handlers allow you to hook up `aiconfig` runs to monitoring and observability endpoints of your choosing.
- **Evaluation**<div className="label basic coming-soon">Coming Soon</div>: define custom evaluators and run batch evaluation to measure the performance of your `aiconfig`.
- **Routing**<div className="label basic coming-soon">Coming Soon</div>: define custom routers over a series of `aiconfig`s to intelligently route incoming requests over prompts and models (i.e. prompt routing and model routing).

<!-- :::tip
Go to [Customization & Extensibility](/docs/category/extensibility) to learn more about AIConfig extensibility
::: -->
