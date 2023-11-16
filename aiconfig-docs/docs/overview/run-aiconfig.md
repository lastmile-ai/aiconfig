---
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Run a Prompt

:::tip
**TLDR**: Call `config.run("prompt_name")`.

If you want to re-run the transitive closure of dependencies in a prompt chain, call `config.run("prompt_name", params, options, run_with_dependencies=True)`.
:::

Once you've [created an `aiconfig`](/docs/overview/create-an-aiconfig), defined your prompts and [prompt chains](/docs/overview/define-prompt-chain), it is time to run the prompt.

Running a prompt means invoking model inference for that prompt. The interface for running a prompt is the same no matter what underlying model is being invoked. This is one of the things that makes `aiconfig` powerful -- by removing model-specific logic from your application code, it streamlines your application and helps you iterate faster.

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```typescript title="app.ts"
import * as path from "path";
import { AIConfigRuntime } from "aiconfig";

async function runPrompt() {
  const config = AIConfigRuntime.load(path.join(__dirname, "aiconfig.json"));
  const result = await config.run("prompt_name");
  return result;
}
```

</TabItem>
<TabItem value="python">

```python title="app.py"
from aiconfig import AIConfigRuntime

config = AIConfigRuntime.load('aiconfig.json')
result = await config.run("prompt_name")
```

</TabItem>
</Tabs>

Under the covers, the `run` function does a couple of things:

- It deserializes the given prompt into the data type expected by the model's inference endpoint.
- It applies model settings specified in the prompt and global [metadata](/docs/overview/ai-config-format#metadata).
- It passes data using [parameters](/docs/overview/parameters) specified in the `run` call.
- It calls the model's inference endpoint with the fully resolved arguments in the shape expected by the model.
- Finally, it caches the resulting outputs in the `AIConfigRuntime` object.

## Run a single Prompt

Running a single prompt is just done with `config.run`. The request will be routed to the model corresponding to that prompt.

:::note
The nice side effect of this is that you can swap out `aiconfig`s used by your application, change the underlying models and settings, and never need to update your application code!
:::

## Run a Prompt chain

### Running with cached outputs

Consider the following example `aiconfig`. `gen_itinerary` is a prompt chain that depends on the output of `get_activities`.

```json
{
  "name": "NYC Trip Planner",
  "description": "Intrepid explorer with ChatGPT and AIConfig",
  "schema_version": "latest",
  "metadata": {},
  "prompts": [
    {
      "name": "get_activities",
      "input": "Tell me 10 fun attractions to do in NYC.",
      "metadata": {
        "model": "gpt-3.5-turbo"
      }
    },
    {
      "name": "gen_itinerary",
      "input": "Generate an itinerary ordered by geographic location for these activities: {{get_activities.output}}.",
      "metadata": {
        "model": "gpt-4"
      }
    }
  ]
}
```

By default, calling `gen_itinerary` will use the cached output for `get_activities`.

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```typescript title="app.ts"
import * as path from "path";
import { AIConfigRuntime, InferenceOptions } from "aiconfig";

async function travelWithGPT() {
  const config = AIConfigRuntime.load(
    path.join(__dirname, "travel.aiconfig.json")
  );

  await config.run("get_activities");

  // Uses the cached output for `get_activities` to resolve the `gen_itinerary` prompt
  await config.run("gen_itinerary");
}
```

</TabItem>
<TabItem value="python">

```python title="app.py"
from aiconfig import AIConfigRuntime, InferenceOptions
config = AIConfigRuntime.load('travel.aiconfig.json')

await config.run("get_activities")

# Uses the cached output for `get_activities` to resolve the `gen_itinerary` prompt
await config.run("gen_itinerary");
```

</TabItem>
</Tabs>

### Re-running the entire chain

Running with dependencies is useful to re-executing [prompt chains](/docs/overview/define-prompt-chain).

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```typescript title="app.ts"
import * as path from "path";
import { AIConfigRuntime, InferenceOptions } from "aiconfig";

async function travelWithGPT() {
  const config = AIConfigRuntime.load(
    path.join(__dirname, "travel.aiconfig.json")
  );

  // Re-runs `get_activities` first, and then uses the output to resolve the `gen_itinerary` prompt
  await config.runWithDependencies("gen_itinerary");
}
```

</TabItem>
<TabItem value="python">

```python title="app.py"
from aiconfig import AIConfigRuntime, InferenceOptions
config = AIConfigRuntime.load('travel.aiconfig.json')

# Re-runs `get_activities` first, and then uses the output to resolve the `gen_itinerary` prompt
await config.run("gen_itinerary", run_with_dependencies=True);
```

</TabItem>
</Tabs>

## Streaming outputs

The `run` API makes it easy to stream outputs in a consistent way across any model that supports it.

You can pass in an `InferenceOptions` object, which allows you to specify a streaming callback:

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```typescript title="app.ts"
import * as path from "path";
import { AIConfigRuntime, InferenceOptions } from "aiconfig";

async function streamOutputs() {
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

inference_options = InferenceOptions(stream=True) # Defines a console streaming callback
await config.run("get_activities", options=inference_options)
```

</TabItem>
</Tabs>

## Passing data into prompts

You can pass data into prompts using parameters. Please see [this guide](/docs/overview/parameters) to learn more.
