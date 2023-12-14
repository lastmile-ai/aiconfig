---
sidebar_position: 14
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Extensibility

AIConfig is designed to be customized and extended for your use-case. There are some key extension points for AIConfig:

1. Supporting other models (BYO Model)
2. Callback event handlers
3. Custom metadata

## 1. Bring your own Model

You can use any generative AI model with the `aiconfig` format. All you need to do is define a `ModelParser` class. This class is responsible for 3 key operations:

- **serialize** prompts, model parameters and inference outputs into an `aiconfig`.
- **deserialize** existing `aiconfig` `Prompts` for that model into the data that the model accepts (e.g. OpenAI chat completion params).
- **run** inference using a model (e.g. calling the OpenAI API or a model running locally).

:::tip
See some existing `aiconfig` extensions to learn how to build your own:

- [LLaMA2 extension](https://github.com/lastmile-ai/aiconfig/tree/main/extensions/llama)
- [Hugging Face extension](https://github.com/lastmile-ai/aiconfig/tree/main/extensions/HuggingFace)

:::

### Define a custom `ModelParser`

In this guide, you will learn the basics of defining your own custom `ModelParser` for use in the AIConfig library. `ModelParser`s play a crucial role in managing and interacting with AI models within the AIConfig SDK. You can create custom `ModelParser`s to suit your specific needs and integrate them seamlessly into AIConfig.

### `ModelParser` class

The `ModelParser` is an abstract base class that serves as the foundation for all `ModelParser`s. It defines a set of methods and behaviors that any `ModelParser` implementation must adhere to. Below are the key methods defined in the `ModelParser` class:

- `id()`
  Returns an identifier for the model parser (e.g., "OpenAIModelParser, HuggingFaceTextGeneration", etc.).
- `serialize()`
  Serialize a prompt and additional metadata/model settings into a `Prompt` object that can be saved in the AIConfig.
- `deserialize()`
  Deserialize a `Prompt` object loaded from an AIConfig into a structure that can be used for model inference.
- `run()`
  Execute model inference based on completion data constructed in the `deserialize()` method. It saves the response or output in `prompt.outputs`.
- `get_output_text()`: Get the output text from the output object containing model inference response.
- `get_model_settings()`: Extract the AI model's settings from the AIConfig

### `ModelParser` extensibility

When defining your custom `ModelParser`, you can inherit from the `ModelParser` class and override its methods as needed to customize the behavior for your specific AI models. This extensibility allows you to seamlessly integrate your `ModelParser` into the AIConfig framework and manage AI models with ease.

Here are some helpful resources to get started:

1. `ModelParser` class ([Python](https://github.com/lastmile-ai/aiconfig/blob/main/python/src/aiconfig/model_parser.py), [TypeScript](https://github.com/lastmile-ai/aiconfig/blob/main/typescript/lib/modelParser.ts)).
2. OpenAI Chat `ModelParser` ([Python](https://github.com/lastmile-ai/aiconfig/blob/main/python/src/aiconfig/default_parsers/openai.py#L25), [TypeScript](https://github.com/lastmile-ai/aiconfig/blob/main/typescript/lib/parsers/openai.ts#L261))

### `ParameterizedModelParser` class

In some cases, you may want to create a specialized `ModelParser` that handles parameterization of prompts. `ParameterizedModelParser` is an abstract subclass of `ModelParser` that provides additional methods and utilities for parameterization.

:::info
In AIConfig, parameters refer to the handlebar syntax used by prompt inputs to denote a placeholder for another value. Learn more in the following sections:

- [Passing data into prompts](/docs/parameters)
- [Parameter chains](/docs/define-prompt-chain)

:::

### `ParameterizedModelParser` extensibility

When defining your own custom `ModelParser`, you can choose to inherit from the `ParameterizedModelParser` class to take advantage of the parameterization features provided by AIConfig. This allows you to create model parsers that can handle prompts with placeholders and dynamically replace them with actual values during serialization and deserialization.

By incorporating parameterization into your model parser, you can create AIConfigs that are more flexible and adaptable to different use cases, as well as facilitate the customization of prompt templates to meet specific requirements.

Another notable benefit of using parameterization is the ability to leverage the `run_with_dependencies` feature. The `run_with_dependencies` API method allows you to execute prompts with resolved dependencies and prompt references, providing more advanced control over the model's behavior.

The `ParameterizedModelParser` class and associated helper utilities empower you to harness the power of parameterization in your AI configuration management, offering greater flexibility and control over how prompts are processed and used in model inference.

### Helper Utils for `ParameterizedModelParser`

The `ParameterizedModelParser` class extends the capabilities of the base `ModelParser` and includes the following methods:

- Python `resolve_prompt_template()` TypeScript: `resolvePromptTemplate()`
  Resolves a templated string with provided parameters, allowing for dynamic prompt generation.
- Python `get_prompt_template()` TypeScript: `getPromptTemplate()`
  An overrideable method that returns a template for a prompt. Customize this method to specify how prompt templates are extracted from prompts.

### Helper Utilities for Parameterization

To facilitate parameterization, AIConfig provides a set of helper utilities:

- Python: `resolve_parameters()`
  - Resolves parameters within a given string by substituting placeholders with actual values.
- Python: `resolve_prompt_string()` TypeScript: `resolvePromptString()`
  Resolves a templated string with parameters, similar to the `resolve_prompt_template()` method of the `ParameterizedModelParser` class.
- Python: `resolve_parametrized_prompt()` TypeScript: `resolvePrompt() `
  Resolves a parametrized prompt by substituting parameter placeholders with their corresponding values.
- Python: `resolve_system_prompt()` TypeScript: `resolvePrompt() `
  Resolves system prompts, often used in multi-turn conversations, by applying parameterization to system prompt templates.

These utilities enable dynamic parameterization of prompts and customization of prompt templates to meet specific requirements.

### Contributing

Have a custom `ModelParser` implementation that others may find useful? Please consider packaging it as an AIConfig Extension by following our [Contributing Guidelines](/docs/contributing)!

## 2. Callback handlers

The AIConfig SDK has a `CallbackManager` class provides a stack trace of what's going on under the covers, which is especially useful for complex control flow operations.

Anyone can register a callback, and filter for the events they care about. You can subsequently use these callbacks to integrate with your own monitoring and observability systems.

See the [**Tracing & Monitoring**](/docs/monitoring-aiconfig) section to learn how to use event callbacks

## 3. Custom metadata

You can store any kind of JSON-serializable metadata in an `aiconfig`. See the [metadata schema details](/docs/ai-config-format#metadata) to learn more.

To add metadata, use the `config.set_metadata` (Python) or `config.setMetadata` (TypeScript) API.
