---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# The AIConfig Format

## Introduction

`aiconfig` files are source-control friendly JSON documents that contain generative AI model settings, prompt inputs and outputs, and flexible multi-purpose metadata.

In short, `aiconfig` defines the _signature_ of generative AI model behavior:

- **prompts** and prompt chains that constitute the input
- **model** to run inference
- **model parameters** to tune the model behavior
- **outputs** cached from previous inference runs, which can be serialized optionally.

The `aiconfig` file format is meant to be extremely flexible, and can be used for a wide variety of use-cases. Specifically:

1. AIConfig is **multi-modal**. Prompt inputs and outputs can specify MIME types and reference a file or binary output. This allows `aiconfig` to be used with models of any modality (text-to-speech, image+text-to-text, audio-to-text, etc.)
2. AIConfig is **model-agnostic**. As long as the data is serialized in the AIConfig format, it can be deserialized by any model-specific parser to perform inference. Custom extensions can be defined for hyper-local use-cases.

:::tip

The full AIConfig schema can be found **[here](https://github.com/lastmile-ai/aiconfig/blob/main/schema/aiconfig.schema.json)**. The corresponding [TypeScript types](https://github.com/lastmile-ai/aiconfig/blob/main/typescript/types.ts#L6) make it easy to reason about it.

:::

## Top-level structure

At the highest level, `aiconfig` has the following properties:

|                                                                      |                                                                                                                            |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `name`<div className="label basic required">Required</div>           | Friendly name descriptor for the AIConfig. Could default to the filename if not specified.                                 |
| `description`                                                        | Description of the AIConfig. If you have a collection of different AIConfigs, this can be used for dynamic prompt routing. |
| `schema_version`<div className="label basic required">Required</div> | The version of the AIConfig schema (e.g. `latest`).                                                                        |
| `metadata`                                                           | Root-level metadata that applies to the entire AIConfig, containing things like model settings and global parameters.      |
| `prompts`                                                            | Array of prompts that make up the AIConfig.                                                                                |
| _extra user-defined properties_                                      | Additional properties can be specified that may be used for specific use-cases.                                            |

### Example `aiconfig`

<details open>
<summary>`sql.aiconfig.json` example</summary>
```json
{
  "name": "gpt4 as your data engineer",
  "description": "A SQL coding assistant that generates SQL queries for the desired output.",
  "schema_version": "latest",
  "metadata": {
    "models": {
      "gpt-4": {
        "model": "gpt-4",
        "top_p": 1,
        "max_tokens": 3000,
        "temperature": 1,
        "system_prompt": "You are an expert at SQL..."
      }
    }
  },
  "prompts": [
    {
      "name": "write_sql",
      "input": "Write me a {{sql_language}} query to get this final output: {{output_data}}. Use the tables relationships defined here: {{table_relationships}}.",
      "metadata": {
        "model": "gpt-4",
        "parameters": {
          "sql_language": "mysql",
          "output_data": "This is a parameter that follows the handlebars syntax. It allows you to create templatized prompts, and override them with values when an aiconfig is run in code",
          "table_relationships": "For example, you could invoke config.run('write_sql', table_relationships=get_table_schema(my_table)) to dynamically specify table relationships"
        }
      }
    },
    {
      "name": "postgresql",
      "input": "Translate the following into PostgreSQL code:\n {{write_sql.output}}",
      "metadata": {
        "model": {
          "name": "gpt-4",
          "settings": {
            "model": "gpt-4",
            "max_tokens": 3000, // Override prompt-specific model parameters here.
            "temperature": 0.75 // They will get merged with the GPT-4 settings specified in root metadata.
          }
        }
      },
      "outputs": [
        /* Output(s) for this prompt, if any. See below for details */
      ]
    }
  ]
}
```
</details>

## Prompts

Prompts are the primary building block of `aiconfig`. They store the inputs (and optionally the outputs) for a model, as well as any prompt-specific metadata.
All prompts have the following basic structure:

|                                                             |                                                                                                                                                                                                             |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`<div className="label basic required">Required</div>  | A unique identifier for the prompt. This is used to reference the prompt in other parts of the AIConfig, and when using the SDK.                                                                            |
| `input`<div className="label basic required">Required</div> | The input prompt - this can be a `string`, or a complex object that represents one or more inputs (e.g. image URI and string prompt).                                                                       |
| `metadata`                                                  | Prompt-specific metadata that applies to this prompt, containing things like model settings and prompt parameters. This gets merged with the root metadata, and takes precedence for overridden properties. |
| `outputs`                                                   | Optional array of outputs representing a previous inference run for this prompt.                                                                                                                            |
| _extra user-defined properties_                             | Additional properties can be specified that may be used for specific use-cases.                                                                                                                             |

### Prompt input

The input to a model can be a string (e.g. for an LLM), or a more complex prompt for multi-modal models (e.g. audio file, or a combination of different artifacts as a single input). The `input` field makes it possible to specify any kind of model input.

It is typed as a union type:

```typescript
type PromptInput =
  | {
      /**
       * Input to the model. This can represent a single input, or multiple inputs.
       * The structure of the data object is up to the ModelParser. For example,
       * a multi-modal ModelParser can choose to key the data by MIME type.
       */
      data?: JSONValue;

      [k: string]: any;
    }
  | string;
```

### Prompt outputs

Executing inference for a prompt results in an output or array of outputs. These outputs can be optionally serialized to an `aiconfig`.

All outputs have an `output_type` field, which is a string defining what type of output it is.

#### `execute_result`

This output type is the result of running inference for a prompt.

```typescript
type ExecuteResult = {
  output_type: "execute_result";

  /**
   * A result's prompt number, if there are multiple outputs (e.g. multiple choices).
   */
  execution_count?: number;

  /**
   * The result of executing the prompt.
   */
  data: JSONValue;

  /**
   * The MIME type of the result. If not specified, the MIME type will be assumed to be plain text.
   */
  mime_type?: string;

  /**
   * Output metadata.
   */
  metadata?: {
    [k: string]: any;
  };
};
```

#### `error`

This output type can be used to store errors encountered during inference.

```typescript
type Error = {
  /**
   * Type of output.
   */
  output_type: "error";

  /**
   * The name of the error.
   */
  ename: string;

  /**
   * The value, or message, of the error.
   */
  evalue: string;

  /**
   * The error's traceback, represented as an array of strings.
   */
  traceback: string[];
};
```

#### Example prompt output

This is the result of executing a GPT-4 text completion.

```typescript
{
    "output_type": "execute_result",
    "execution_count": 0,
    "data": {
        "role": "assistant",
        "content": "Idina Menzel was born in Brooklyn, New York on May 30, 1971."
    },
    "metadata": {
        "id": "chatcmpl-8I6nJzTo36E4PW60gGPuivJc0nEJB",
        "object": "chat.completion",
        "created": 1699326713,
        "model": "gpt-4-0613",
        "usage": {
            "prompt_tokens": 83,
            "completion_tokens": 19,
            "total_tokens": 102
        },
        "finish_reason": "stop"
    }
}
```

## Metadata

Metadata is a place for you to put any JSON-serializable information about the `aiconfig`, prompt, or output. Metadata is a namespace, which means:

- if the same properties are specified in root and prompt metadata, the sub-metadata is preferred (i.e. the root metadata is merged into the prompt metadata).
- common properties can be up-leveled into the root metadata to simplify the `aiconfig`.
- custom metadata should use unique property names, since different extensions can add properties to metadata.

### Root metadata

The following metadata keys are defined at the `aiconfig` level. They are all optional:

| Key                             | Type                                                    | Description                                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `parameters`                    | `dict` (keyed by parameter name)                        | Parameters key-value pairs that may be used in one or more text prompt inputs with the [handlebars](https://handlebarsjs.com) `{{parameter_name}}` syntax                |
| `models`                        | `dict` (keyed by model name)                            | Globally defined model settings. Any prompts that use these models will have these settings applied by default, unless they override them with their own model settings. |
| `default_model`                 | `string`                                                | Name of default model to use for prompts that do not specify a model in their own metadata.                                                                              |
| `model_parsers`                 | `dict` (keyed by model name, value is `ModelParser` ID) | This is useful if you want to use a custom ModelParser for a model, or if a single ModelParser can handle multiple models.                                               |
| _extra user-defined properties_ | JSON-serializable object                                | Additional properties can be specified that may be used for specific use-cases.                                                                                          |

### Prompt metadata

| Key                             | Type                                                              | Description                                                                                                                                               |
| ------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parameters`                    | `dict` (keyed by parameter name)                                  | Parameters key-value pairs that may be used in one or more text prompt inputs with the [handlebars](https://handlebarsjs.com) `{{parameter_name}}` syntax |
| `model`                         | `string` (model name) or `dict` (with name and settings of model) | Model name/settings that apply to this prompt. If this is undefined, the `default_model` specified in the root metadata will be used.                     |
| `tags`                          | `list[string]`                                                    | A list of string tags on the prompt.                                                                                                                      |
| _extra user-defined properties_ | JSON-serializable object                                          | Additional properties can be specified that may be used for specific use-cases.                                                                           |

### Output metadata

Output metadata contains information like completion reason, usage tokens, etc.

| Key                             | Type                     | Description                                                                     |
| ------------------------------- | ------------------------ | ------------------------------------------------------------------------------- |
| _extra user-defined properties_ | JSON-serializable object | Additional properties can be specified that may be used for specific use-cases. |

See [this example](#example-prompt-output) to see the output structure.

## Final thoughts

As you can see, the `aiconfig` schema is flexible enough to be used for a wide array of use-cases out of the box, and can be customized further. To see how to customize and extend AIConfig for your needs, see the **[Customization & Extensibility](/docs/category/customization--extensibility)** section.

:::note

We aim to maintain backwards-compatibility of the schema format, and don't foresee it changing often. **If you have a use-case that the existing schema doesn't satisfy, please _[get in touch with us](https://discord.com/invite/xBhNKTetGx)_**.

:::
