---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/src/core/TabConstants';
import {Command, SLCommand} from '@site/elements';

# Getting Started

## Example

:::tip

See the [Getting Started](/docs/introduction/getting-started) guide for a detailed overview, and spend time getting familiar with the [`aiconfig` file format](/docs/overview/ai-config-format).

:::

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

:::tip

You can use the `pr` revset to automatically pull and checkout GitHub pull request. For example, `sl goto pr123`. See `sl help revsets` for more info.

:::

:::tip

You can use the `pr` revset to automatically pull and checkout GitHub pull request. For example, `sl goto pr123`. See `sl help revsets` for more info.

:::

```
sl push
```

```typescript
/**

Copyright (c) LastMile AI, Inc.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
*/

const theme = {
  plain: {
    color: "#FFFFFF",
    backgroundColor: "#282C34",
  },
};

export default theme;
```

:::caution

This is a warning

1. `sl ghstack` requires having _write_ access to the GitHub repo that you cloned. If you do not have write access, consider using [Sapling Stacks](./sapling-stack.md) instead.
2. You will NOT be able to merge these pull requests using the normal GitHub UI, as their base branches will not be `main` (or whatever the default branch of your repository is). Instead, lands must be done via the command line: `sl ghstack land $PR_URL`.

:::

Further, note that Sapling's version of ghstack takes a different approach to configuration and authorization than stock ghstack. Specifically, **it does not rely on a `~/.ghstackrc` file**. So long as you have configured the GitHub CLI as described in [Getting Started](../introduction/getting-started.md#authenticating-with-github), you can start using <SLCommand name="ghstack" /> directly.

<Tabs groupId="android-language" queryString defaultValue={constants.defaultAndroidLanguage} values={constants.androidLanguages}>
<TabItem value="java">

```java
package com.your_application_name;

import android.content.Intent;
import android.os.Bundle;
import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import javax.annotation.Nullable;

public class MyTaskService extends HeadlessJsTaskService {

  @Override
  protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
    Bundle extras = intent.getExtras();
    if (extras != null) {
      return new HeadlessJsTaskConfig(
          "SomeTaskName",
          Arguments.fromBundle(extras),
          5000, // timeout in milliseconds for the task
          false // optional: defines whether or not the task is allowed in foreground. Default is false
        );
    }
    return null;
  }
}
```

</TabItem>
<TabItem value="kotlin">

```kotlin
package com.your_application_name;

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class MyTaskService : HeadlessJsTaskService() {
    override fun getTaskConfig(intent: Intent): HeadlessJsTaskConfig? {
        return intent.extras?.let {
            HeadlessJsTaskConfig(
                "SomeTaskName",
                Arguments.fromBundle(it),
                5000, // timeout for the task
                false // optional: defines whether or not the task is allowed in foreground.
                // Default is false
            )
        }
    }
}

```

</TabItem>
<TabItem value="python">

```python
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

|                 | Git                  | Sapling       |
| --------------- | -------------------- | ------------- |
| Your commits    | N/A                  | `sl`          |
| Current history | `git log`            | `sl log`      |
| Edited files    | `git status`         | `sl status`   |
| Current hash    | `git rev-parse HEAD` | `sl whereami` |
| Pending changes | `git diff`           | `sl diff`     |
| Current commit  | `git show`           | `sl show`     |

| Name                                                         | Type   | Description                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| content <div className="label basic required">Required</div> | object | `message` - a message to share<br/>`url` - a URL to share <div class="label ios">iOS</div><br/>`title` - title of the message <div class="label android">Android</div><hr/>At least one of `url` and `message` is required.                                                                                                                                              |
| options                                                      | object | `dialogTitle` <div class="label android">Android</div><br/>`excludedActivityTypes` <div class="label ios">iOS</div><br/>`subject` - a subject to share via email <div class="label ios">iOS</div><br/>`tintColor` <div class="label ios">iOS</div><br/>`anchor` - the node to which the action sheet should be anchored (used for iPad) <div class="label ios">iOS</div> |
