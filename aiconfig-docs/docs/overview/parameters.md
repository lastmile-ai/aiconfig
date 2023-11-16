---
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Passing Data into Prompts

Passing data into prompts is fundamental to `aiconfig`. It allows you to store prompt _templates_ as the config, and resolve the template into a prompt by passing in data.

In `aiconfig`, data flow is accomplished using parameters. Parameters can be defined statically in the [`aiconfig` metadata](/docs/overview/ai-config-format#metadata), and also passed in dynamically when using the AIConfig SDK.

:::info
Parameters allow you to pass data _into_ prompts, as well as _between_ prompts. For more information on the latter, see [Parameter Chains](/docs/overview/define-prompt-chain#parameter-chains).
:::

## Parameter syntax

`aiconfig` uses [`{{handlebars}}`](https://handlebarsjs.com/) templating syntax for specifying parameters. While advanced handlebars syntax is supported, the most common way of specifying a parameter is by using `{{parameter_name}}` in the string.

:::note
**Advanced**: It is possible to use a different templating syntax than handlebars. You will need to implement a new kind of [`ParameterizedModelParser`](https://github.com/lastmile-ai/aiconfig/blob/main/python/src/aiconfig/default_parsers/parameterized_model_parser.py).
:::

### Specifying parameters in `aiconfig`

Here is an example `aiconfig` that specifies parameters in the config metadata.
Parameters can be specified globally in the global metadata, or in prompt-specific metadata.

In this case, `sql_language` is set to `postgresql` by default, but overridden to be `sqlserver` by the `write_sql` prompt. The other parameters used by the prompt aren't specified in the `aiconfig`, so they will have to be passed in when running the prompt.

```json title="sql.aiconfig.json"
{
  "name": "gpt4 as your data engineer",
  "description": "A SQL coding assistant that generates SQL queries for the desired output.",
  "schema_version": "latest",
  "metadata": {
    "parameters": {
      "sql_language": "postgresql"
    }
  },
  "prompts": [
    {
      "name": "write_sql",
      "input": "Write me a {{sql_language}} query to get this final output: {{output_data}}. Use the tables relationships defined here: {{table_relationships}}.",
      "metadata": {
        "model": "gpt-4",
        "parameters": {
          "sql_language": "sqlserver"
        }
      }
    },
    {
      "name": "translate",
      "input": "Translate the following {{sql_language}} into {{target_language}} code:\n {{write_sql.output}}",
      "metadata": {
        "model": "gpt-4"
      }
    }
  ]
}
```

:::info
Read more about the `aiconfig` metadata schema [here](docs/overview/ai-config-format#metadata).
:::

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```typescript title="app.ts"
import * as path from "path";
import { AIConfigRuntime } from "aiconfig";

async function parameterizedPrompt() {
  // Load the AIConfig. You can also use AIConfigRuntime.loadJSON({})
  const config = AIConfigRuntime.load(
    path.join(__dirname, "sql.aiconfig.json")
  );

  // Set a global parameter
  config.setParameter("sql_language", "mysql");

  // Set a prompt-specific parameter
  config.setParameter(
    "output_data",
    "user_name, user_email, trial. output granularity is the trial_id.",
    /*promptName*/ "write_sql"
  );
}

config.save();
```

</TabItem>
<TabItem value="python">

```python title="app.py"
from aiconfig import AIConfigRuntime

# Load the aiconfig.
config = AIConfigRuntime.load('sql.aiconfig.json')

# Set a global parameter
config.set_parameter("sql_language", "mysql")

# Set a prompt-specific parameter
config.set_parameter(
    "output_data",
    "user_name, user_email, trial. output granularity is the trial_id.",
    "write_sql" #prompt_name
)

config.save()
```

</TabItem>
</Tabs>

### Specifying parameters in code

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```typescript title="app.ts"
import * as path from "path";
import { AIConfigRuntime } from "aiconfig";

async function parameterizedPrompt() {
  // Load the AIConfig. You can also use AIConfigRuntime.loadJSON({})
  const config = AIConfigRuntime.load(
    path.join(__dirname, "sql.aiconfig.json")
  );

  const params = {
    sql_language: "mysql", // This will override the default value in the aiconfig
    output_data:
      "user_name, user_email, trial. output granularity is the trial_id.",
    table_relationships:
      "user table, trial table, trial_step table. a user can create many trials. each trial has many trial_steps.",
  };

  // Run the prompt with parameters
  await config.run("write_sql", params);
}
```

</TabItem>
<TabItem value="python">

```python title="app.py"
from aiconfig import AIConfigRuntime

# Load the aiconfig.
config = AIConfigRuntime.load('sql.aiconfig.json')

params = {
    "sql_language": "mysql", # This will override the default value in the aiconfig
    "output_data": "user_name, user_email, trial. output granularity is the trial_id.",
    "table_relationships": "user table, trial table, trial_step table. a user can create many trials. each trial has many trial_steps."
}

# Run the prompt with parameters
await config.run("write_sql", params)
```

</TabItem>
</Tabs>

### Resolving the prompt

Use the `resolve` function to see how parameters are applied to a prompt template before running the prompt.

In the example above, replace `config.run` with `config.resolve`:

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```typescript
await config.resolve("write_sql", params);
```

</TabItem>
<TabItem value="python">

```python
await config.resolve("write_sql", params)
```

</TabItem>
</Tabs>

This will return the fully-resolved completion params that will be passed to the model inference API (in this case OpenAI chat completion):

```json
{
  "messages": [{
    "role": "user",
    "content":
      "Write me a mysql query to get this final output:
      user_name, user_email, trial. output granularity is the
      trial_id. Use the tables relationships defined
      here: user table, trial table, trial_step table. a
      user can create many trials. each trial has many
      trial_steps."
  }],
  "model": "gpt-4",
}
```

### Passing dynamic data

Because parameters can be passed in to prompts programmatically, exactly what gets passed in can be dynamic. For the example above you could have a dropdown of possible SQL languagesin your app, and you can set the `sql_langauge` parameter to the value selected by a user.

:::tip
This pattern can be used to apply Retrieval Augmented Generation (RAG) techniques with `aiconfig`. For more details, see the [RAG cookbook](/docs/cookbooks/aiconfig-rag).
:::

## What gets parameterized

In addition to the prompt itself, there are other properties in an `aiconfig` that may also get parameterized.

:::note
Exactly which properties get parameterized is dependent on the `ModelParser` for that model on what it parameterizes.
:::

For the default model parsers (e.g. GPT-\*, PaLM, Hugging Face Text Generation), the following get parameterized:

- prompt
- system prompt (specified as `system_prompt` in metadata)
- prompt chain (e.g. previous messages in conversation history)

## Passing data into a prompt chain

Passing data into a [prompt chain](/docs/overview/define-prompt-chain#what-are-prompt-chains) is no different than passing data into a single prompt.

In the example above, the `translate` prompt is a prompt chain because it depends on the output of the `write_sql` prompt:

```json
{
  "name": "translate",
  "input": "Translate the following {{sql_language}} into {{target_language}} code:\n {{write_sql.output}}",
  "metadata": {
    "model": "gpt-4"
  }
}
```

To run this prompt chain properly, you'd need to pass in parameters for both prompts.

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="node">

```typescript title="app.ts"
import * as path from "path";
import { AIConfigRuntime } from "aiconfig";

async function parameterizedPrompt() {
  // Load the AIConfig. You can also use AIConfigRuntime.loadJSON({})
  const config = AIConfigRuntime.load(
    path.join(__dirname, "sql.aiconfig.json")
  );

  const params = {
    // Parameters for `translate` prompt
    target_language: "postgresql",
    // Parameters for `write_sql` prompt
    sql_language: "mysql",
    output_data:
      "user_name, user_email, trial. output granularity is the trial_id.",
    table_relationships:
      "user table, trial table, trial_step table. a user can create many trials. each trial has many trial_steps.",
  };

  // Run the prompt chain
  await config.runWithDependencies("translate", params);
}
```

</TabItem>
<TabItem value="python">

```python title="app.py"
from aiconfig import AIConfigRuntime

# Load the aiconfig.
config = AIConfigRuntime.load('sql.aiconfig.json')

params = {
    # Parameters for `translate` prompt
    "target_language": "postgresql",
    # Parameters for `write_sql` prompt
    "sql_language": "mysql",
    "output_data": "user_name, user_email, trial. output granularity is the trial_id.",
    "table_relationships": "user table, trial table, trial_step table. a user can create many trials. each trial has many trial_steps."
}

# Run the prompt chain
await config.run("translate", params, run_with_dependencies=True)
```

</TabItem>
</Tabs>
