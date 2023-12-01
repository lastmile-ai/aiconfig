---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Create an AIConfig

There are 2 ways to create an `aiconfig` from scratch.

1. Using the [AIConfig SDK](#aiconfig-sdk)
2. Using the [AI Workbook editor](#ai-workbook-editor)

## AIConfig SDK

<!-- [![colab](https://colab.research.google.com/assets/colab-badge.svg)](https://github.com/lastmile-ai/aiconfig/blob/main/cookbooks/Create-AIConfig-Programmatically/create_aiconfig_programmatically.ipynb) -->

### Create `aiconfig` programmatically

You can use the `create` function to create an empty `aiconfig`. To create prompts in the config, you can use the `serialize` function, which takes in data in the form that a model expects (e.g. OpenAI completion params), and creates Prompt objects that can be saved in the `aiconfig`.

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```typescript title="app.ts"
import OpenAI from "openai";
import * as path from "path";
import { AIConfigRuntime } from "aiconfig";

async function createAIConfig() {
  const aiConfig = AIConfigRuntime.create(
    "MyAIConfig",
    "This is my new AIConfig"
  );

  // OpenAI completion params
  const model = "gpt-4-0613";
  const data: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
    model,
    messages: [
      { role: "user", content: "Say this is a test" },
      { role: "assistant", content: "This is a test." },
      { role: "user", content: "What do you say?" },
    ],
  };

  // Serialize the data into the aiconfig format.
  const result = await aiConfig.serialize(model, data, "demoPrompt");
  const prompts = Array.isArray(result) ? result : [result];

  // Add the prompts to the aiconfig
  for (const prompt of prompts) {
    aiConfig.addPrompt(prompt);
  }

  // Try running "demoPrompt" (this will run "What do you say?")
  const output = await aiConfig.run("demoPrompt");

  // Save the aiconfig to disk
  aiConfig.save("new.aiconfig.json", { serializeOutputs: true });
}
```

</TabItem>
<TabItem value="python">

:::tip
[Clone this notebook](https://github.com/lastmile-ai/aiconfig/blob/main/cookbooks/Create-AIConfig-Programmatically/create_aiconfig_programmatically.ipynb) to create an `aiconfig` programmatically.
:::

```python title="app.py"
import asyncio
from aiconfig import AIConfigRuntime

async def main():
    new_config = AIConfigRuntime.create("my_aiconfig", "This is my new AIConfig")

    # OpenAI completion params
    model = "gpt-4"
    data = {
        "model": model,
        "messages": [
        { "role": "user", "content": "Say this is a test" },
        { "role": "assistant", "content": "This is a test." },
        { "role": "user", "content": "What do you say?" }
        ]
    }

    # Serialize the data into the aiconfig format.
    prompts = await new_config.serialize(model, data, "prompts")

    # Add the prompts to the aiconfig
    for i, prompt in enumerate(prompts):
        new_config.add_prompt(f"prompt_name_{i}", prompt)

    # Save the aiconfig to disk
    new_config.save('new.aiconfig.json', include_outputs=True)

asyncio.run(main())
```

</TabItem>
</Tabs>

### OpenAI API Python Wrapper

If you're using OpenAI chat models, you can also use introspection to wrap OpenAI API calls and save an `aiconfig` automatically:

Usage: see openai_wrapper.ipynb.

Now call OpenAI regularly. The results will automatically get saved in `new_config`:

```python
completion_params = {
  "model": "gpt-3.5-turbo",
  "temperature": 1,
  "messages": [
      {
        "role": "user",
        "content": "Tell me a joke about config files"
      }
  ],
}

# Updates new_config automatically
response = openai.chat.completions.create(**completion_params)

# Save results to disk
new_config.save("new.aiconfig.json", include_output=True)
```

:::tip
For a complete guide, see the [OpenAI API Wrapper notebook](https://github.com/lastmile-ai/aiconfig/blob/main/cookbooks/OpenAI-ChatCompletion-AIConfigWrapper/openai_wrapper.ipynb).
:::

## AI Workbook editor

AI Workbook is a visual notebook editor for `aiconfig`.

<p align="center">
<video controls height="480" width="800">
    <source src="https://github.com/lastmile-ai/aiconfig/assets/81494782/d826b872-eab6-4245-91dc-96a509b4f5ec"/>
  </video>
</p>

:::tip
In the Jupyter world, an `ipynb` is a JSON file, but it's very rare to edit the JSON directly. Most people use the notebook editor which serializes updates into the `ipynb`.

Using an AI Workbook with an `aiconfig` is meant to satisfy the same behavior.
:::

1. Go to https://lastmileai.dev.
2. Create a new Workbook
3. Once you are done, click "..." and select 'Download as AIConfig'

Try out the workbook playground here: **[NYC Travel Workbook](https://lastmileai.dev/workbooks/clooqs3p200kkpe53u6n2rhr9)**

:::note
We are currently working on a local editor that you can run yourself. For now, please use the hosted version on https://lastmileai.dev.
:::

### Editing existing AIConfig

1. Go to https://lastmileai.dev.
2. Go to Workbooks page: https://lastmileai.dev/workbooks
3. Click dropdown from '+ New Workbook' and select 'Create from AIConfig'
4. Upload `travel.aiconfig.json`

<p align="center">
<video controls height="480" width="800">
    <source src="https://github.com/lastmile-ai/aiconfig/assets/81494782/5d901493-bbda-4f8e-93c7-dd9a91bf242e"/>
  </video>
</p>
