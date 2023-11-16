---
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Define a Prompt Chain

## What are prompt chains

Prompt chains are ways of connecting several prompt calls together (potentially across multiple models). The simplest prompt chain is conversation history in a chatbot -- previous messages are part of a chain and that context affects the model's response to the latest prompt.

You can use prompt chains to orchestrate workflows spanning multiple models. For example, you could generate an image from an audio file using:

- Whisper (audio-to-text)
- GPT-4 (text-to-text) intermediate
- Stable Diffusion (text-to-image)

:::note
See this [**AI Workbook**](https://lastmileai.dev/workbooks/clkoo1u0w00r9phw1jgymo5fi) for an example of a prompt chain
:::

## Prompt chains in AIConfig

AIConfig supports prompt chains in several ways:

1. [Conversation history](#conversation-history)
2. [Parameter chains](#parameter-chains)

### Conversation History

:::info
By default, prompts from the same chat model are considered to be part of the same chat session and automatically added as conversation history.
:::

For example, in the following `aiconfig`, `prompt1` and `prompt2` are considered to be part of the same prompt chain:

```json title="transformers.aiconfig.json"
{
  "name": "palm-chat-aiconfig",
  "schema_version": "latest",
  "metadata": {
    "models": {
      "PaLM Chat": {
        "model": "models/chat-bison-001",
        "temperature": 0.9
      }
    }
  },
  "prompts": [
    {
      "name": "prompt1",
      "input": "What are transformers?",
      "metadata": {
        "model": "PaLM Chat"
      }
    },
    {
      "name": "prompt2",
      "input": "How does this differ from a recurrent neural network?",
      "metadata": {
        "model": "PaLM Chat"
      }
    }
  ]
}
```

In order to treat `prompt2` as an individual prompt, you can set `remember_chat_context` to `false` in the prompt's metadata:

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```typescript title="app.ts"
import * as path from "path";
import { AIConfigRuntime } from "aiconfig";

async function noConversationHistory() {
  const aiConfig = AIConfigRuntime.load(
    path.join(__dirname, "transformers.aiconfig.json")
  );

  aiConfig.setMetadata("remember_chat_context", false, "prompt2");

  // Runs just prompt2, without conversation history from prompt1
  await aiConfig.run("prompt2");

  aiConfig.save();
}
```

</TabItem>
<TabItem value="python">

```python title="app.py"
from aiconfig import AIConfigRuntime

config = AIConfigRuntime.load('transformers.aiconfig.json')

config.set_metadata("remember_chat_context", False, "prompt2")

# Runs just prompt2, without conversation history from prompt1
await config.run("prompt2")

config.save()
```

</TabItem>
</Tabs>

### Parameter Chains

Parameter chains are created by passing data between prompts using parameters.

`aiconfig` uses [`{{handlebars}}`](https://handlebarsjs.com/) templating syntax that allows you to pass data _into_ prompts, and _between_ prompts.

**In order to pass data between prompts, use the `{{<prompt_name>.output}}` or `{{<prompt_name>.input}}` syntax**. `.output` references the result of running `prompt_name`, while `.input` references the prompt itself.

For example, in the following `aiconfig`, `gen_itinerary` references the output of the `get_activities` prompt:

```json title="travel.aiconfig.json"
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

Observe the following:

1. The `gen_itinerary` prompt depends on the output of the `get_activities` prompt.
2. It uses **gpt-4**, whereas the `get_activities` prompt it depends on uses **gpt-3.5-turbo**.

Effectively, this is a prompt chain between `gen_itinerary` and `get_activities` prompts, _as well as_ as a model chain between **gpt-3.5-turbo** and **gpt-4**.

To run this with AIConfig:

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```typescript
import * as path from "path";
import { AIConfigRuntime } from "aiconfig";

async function runPromptChain() {
  const aiConfig = AIConfigRuntime.load(
    path.join(__dirname, "travel.aiconfig.json")
  );

  // This will first run get_activities with GPT-3.5,
  // and then use its output to run the gen_itinerary using GPT-4
  await aiConfig.runWithDependencies("gen_itinerary");
}
```

</TabItem>
<TabItem value="python">

```python
from aiconfig import AIConfigRuntime

config = AIConfigRuntime.load('travel.aiconfig.json')

# This will first run get_activities with GPT-3.5,
# and then use its output to run the gen_itinerary using GPT-4
await config.run(
    "gen_itinerary",
    params=None,
    options=InferenceOptions(stream=True),
    run_with_dependencies=True)
```

</TabItem>
</Tabs>

:::info
Notice how simple the syntax is to perform a fairly complex task - running 2 different prompts across 2 different models and chaining one's output as part of the input of another.
:::

:::tip
You can create fairly complex control flow using parameter chains. `aiconfig` ensures there are no cycles in the control flow by **forcing parameter references only to previous prompts**. This ensures that parameter chains are always a directed acyclic graph (DAG) of dependencies.
:::

:::note
**Advanced**: It is possible to use a different templating syntax than handlebars. You will need to implement a new kind of [`ParameterizedModelParser`](https://github.com/lastmile-ai/aiconfig/blob/main/python/src/aiconfig/default_parsers/parameterized_model_parser.py).
:::
