---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/TabConstants';

# Getting Started

## Quickstart

Suppose we have the following prompts to help us plan a trip to New York.

<details open>
<summary>`travel.aiconfig.json`</summary>
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
      },
      "gpt-4": {
        "model": "gpt-4",
        "max_tokens": 3000,
        "system_prompt": "You are an expert travel coordinator for New York City."
      }
    },
    "default_model": "gpt-3.5-turbo"
  },
  "prompts": [
    {
      "name": "get_activities",
      "input": "Tell me 10 fun attractions to do in NYC."
      // No model is specified, so this defaults to the default_model specified above (gpt-3.5-turbo)
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

Using this `aiconfig` in application code is trivial

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```bash
$ yarn add aiconfig
```

```typescript title="app.ts"
import * as path from "path";
import { AIConfigRuntime, InferenceOptions } from "aiconfig";

async function travelWithGPT() {
  // Alternatively, you can use AIConfigRuntime.loadJSON({/*travel.aiconfig.json contents*/})
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

  // Run a prompt chain, with data passed in as params
  // This will first run get_activities with GPT-3.5, and
  // then use its output to run the gen_itinerary using GPT-4
  await aiConfig.runWithDependencies(
    "gen_itinerary",
    /*params*/ { order_by: "duration" },
    options
  );

  // Save the AIConfig to disk, and serialize outputs from the model run too
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

```python
import

async def get(id: str):
return [item for item in db if item["id"] == id][0] or None

async def callFunction(function_call):
args = function_call.get("arguments", None)
args = json.loads(args) if args else None

    if not args:
        raise Exception("No arguments found")

    match function_call.get("name"):
        case "list":
            return await list_items(args["genre"])
        case "search":
            return await search(args["name"])
        case "get":
            return await get(args["id"])

import asyncio

asyncio.run(function_calling())

```

</TabItem>
</Tabs>

## Using OpenAI API introspection

## Starting with AI Workbooks

```

```
