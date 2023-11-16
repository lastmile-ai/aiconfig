---
sidebar_position: 14
---

# Extensibility

## Extending AIConfig

AIConfig is designed to be customized and extended for your use-case. There are some key extension points for AIConfig:

### Bring your own Model

You can use any generative AI model with the `aiconfig` format. All you need to do is define a `ModelParser` class. This class is responsible for 3 key operations:

- **serialize** prompts, model parameters and inference outputs into an `aiconfig`.
- **deserialize** existing `aiconfig` `Prompts` for that model into the data that the model accepts (e.g. OpenAI chat completion params).
- **run** inference using a model (e.g. calling the OpenAI API or a model running locally).

# Defining Your Own Model Parser

In this guide, you will learn the basics of defining your own custom Model Parser for use in the AIConfig library. Model Parsers play a crucial role in managing and interacting with AI models within the AIConfig SDK. You can create custom Model Parsers to suit your specific needs and integrate them seamlessly into AIConfig.

## ModelParser Class

The `ModelParser` is an abstract base class that serves as the foundation for all Model Parsers. It defines a set of methods and behaviors that any Model Parser implementation must adhere to. Below are the key methods defined in the `ModelParser` class:

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

## Model Parser Extensibility

When defining your custom Model Parser, you can inherit from the `ModelParser` class and override its methods as needed to customize the behavior for your specific AI models. This extensibility allows you to seamlessly integrate your Model Parser into the AIConfig framework and manage AI models with ease.

Here are some helpful resources to get started:

1. `ModelParser` class ([Python](https://github.com/lastmile-ai/aiconfig/blob/main/python/src/aiconfig/model_parser.py), [TypeScript](https://github.com/lastmile-ai/aiconfig/blob/main/typescript/lib/modelParser.ts)).
2. OpenAI Chat `ModelParser` ([Python](https://github.com/lastmile-ai/aiconfig/blob/main/python/src/aiconfig/default_parsers/openai.py#L25), [TypeScript](https://github.com/lastmile-ai/aiconfig/blob/main/typescript/lib/parsers/openai.ts#L261))

### Parameterized Model Parser

In some cases, you may want to create a specialized Model Parser that handles parameterization of prompts. The `ParameterizedModelParser` is an abstract subclass of `ModelParser` that provides additional methods and utilities for parameterization.

#### Quick Note On Parameterization:

In AIConfig, parameters refer to the handlebar syntax used by prompt inputs to denote a placeholder for another value. See # Parameters and Chaining Prompts section

### Model Parser Extensibility with Parameterization

When defining your own custom Model Parser, you can choose to inherit from the `ParameterizedModelParser` class to take advantage of the parameterization features provided by AIConfig. This allows you to create model parsers that can handle prompts with placeholders and dynamically replace them with actual values during serialization and deserialization.

By incorporating parameterization into your model parser, you can create AIConfigs that are more flexible and adaptable to different use cases, as well as facilitate the customization of prompt templates to meet specific requirements.

Another notable benefit of using parameterization is the ability to leverage the `run_with_dependencies` feature. The `run_with_dependencies` API method allows you to execute prompts with resolved dependencies and prompt references, providing more advanced control over the model's behavior.

The `ParameterizedModelParser` class and associated helper utilities empower you to harness the power of parameterization in your AI configuration management, offering greater flexibility and control over how prompts are processed and used in model inference.

### Helper Utils provided with the Parameterized Model Parser Class

The `ParameterizedModelParser` class extends the capabilities of the base `ModelParser` and includes the following methods:

- Python `resolve_prompt_template()` TypeScript: `resolve_prompt_template()`
  Resolves a templated string with provided parameters, allowing for dynamic prompt generation.
- Python `get_prompt_template()` TypeScript: `get_prompt_template()`
  An overrideable method that returns a template for a prompt. Customize this method to specify how prompt templates are extracted from prompts.

### General Helper Utilities for Parameterization

To facilitate parameterization, AIConfig provides a set of helper utilities:

- Python: `resolve_parameters()` TypeScript: `resolveParameters()`
  Resolves parameters within a given string by substituting placeholders with actual values.
- Python: `resolve_prompt_string()` TypeScript: `resolve_prompt_string()`
  Resolves a templated string with parameters, similar to the `resolve_prompt_template()` method of the `ParameterizedModelParser` class.
- Python: `resolve_parametrized_prompt()` TypeScript: `resolve_parametrized_prompt() `
  Resolves a parametrized prompt by substituting parameter placeholders with their corresponding values.
- Python: `resolve_system_prompt()` TypeScript: `resolve_system_prompt() `
  Resolves system prompts, often used in multi-turn conversations, by applying parameterization to system prompt templates.

These utilities enable dynamic parameterization of prompts and customization of prompt templates to meet specific requirements.

### Contributing

Have a custom `ModelParser` implementation that others may find useful? Please consider packaging it as an AIConfig Extension by following our [Contributing Guidelines](https://aiconfig.lastmileai.dev/docs/contributing)!

## Callback handlers

The AIConfig SDK has a `CallbackManager` class which can be used to register callbacks that trace prompt resolution, serialization, deserialization, and inference. This lets you get a stack trace of what's going on under the covers, which is especially useful for complex control flow operations.

Anyone can register a callback, and filter for the events they care about. You can subsequently use these callbacks to integrate with your own monitoring and observability systems.

Video: https://github.com/lastmile-ai/aiconfig/assets/141073967/ce909fc4-881f-40d9-9c67-78a6682b3063

#### Structure of a Callback Event

Each callback event is an object of the CallbackEvent type, containing:

name: The name of the event (e.g., "on_resolve_start").
file: The source file where the event is triggered
data: An object containing relevant data for the event, such as parameters or results.
ts_ns: An optional timestamp in nanoseconds.

#### Writing Custom Callbacks

Custom callbacks are functions that conform to the Callback type. They receive a CallbackEvent object containing event details, and return a Promise. Here's an example of a simple logging callback:

```typescript
const myLoggingCallback: Callback = async (event: CallbackEvent) => {
  console.log(`Event triggered: ${event.name}`, event);
};
```

```python
async def my_logging_callback(event: CallbackEvent) -> None:
  print(f"Event triggered: {event.name}", event)
```

Sample output:

```
Event triggered: on_resolve_start
CallbackEventModel(name='on_resolve_start', file='/Users/John/Projects/aiconfig/python/src/aiconfig/Config.py', data={'prompt_name': 'get_activities', 'params': None}, ts_ns=1700094936363867000)
Event triggered: on_deserialize_start
```

#### Setting up a CallbackManager and Registering Callbacks

To register this callback with the AIConfigRuntime, include it in the array of callbacks when creating a CallbackManager:

```typescript
const myCustomCallback: Callback = async (event: CallbackEvent) => {
  console.log(`Event triggered: ${event.name}`, event);
};

const callbackManager = new CallbackManager([myCustomCallback]);
aiConfigRuntimeInstance.setCallbackManager(callbackManager);
```

```python
async def my_custom_callback(event: CallbackEvent) -> None:
  print(f"Event triggered: {event.name}", event)

callback_manager = CallbackManager([my_custom_callback])
aiconfigRuntimeInstance.set_callback_manager(callback_manager)
```

#### Triggering Callbacks

Callbacks are automatically triggered at specific points in the AIConfigRuntime flow. For example, when the resolve method is called on an AIConfigRuntime instance, it triggers on_resolve_start and on_resolve_end events, which are then passed to the CallbackManager to execute any associated callbacks.

Sample implementation inside source code:

```typescript
  public async resolve(promptName: string, params: JSONObject = {}) {
    const startEvent = {
      name: "on_resolve_start",
      file: __filename,
      data: { promptName, params },
    } as CallbackEvent;
    await this.callbackManager.runCallbacks(startEvent);

    /** Method Implementation*/

    const endEvent = {
      name: "on_resolve_end",
      file: __filename,
      data: { result: resolvedPrompt },
    };
    await this.callbackManager.runCallbacks(endEvent);
    return resolvedPrompt;
  }
```

```python
async def resolve(
    self,
    prompt_name: str,
    params: Optional[dict] = None,
    **kwargs,
):
    event = CallbackEvent("on_resolve_start", __file__, {"prompt_name": prompt_name, "params": params})
    await self.callback_manager.run_callbacks(event)

    """Method Implementation"""

    event = CallbackEvent("on_resolve_complete", __name__, {"result": response})
    await self.callback_manager.run_callbacks(event)
    return response

```

Similarly, ModelParsers should trigger their own events when serializing, deserializing, and running inference. These events are also passed to the CallbackManager to execute any associated callbacks.

#### Handling Callbacks with Timers

The CallbackManager uses a timeout mechanism to ensure callbacks do not hang indefinitely. If a callback does not complete within the specified timeout, it is aborted, and an error is logged. This timeout can be adjusted in the CallbackManager constructor and defaults to 5 if not specified.

```typescript
const customTimeout = 10; // 10 seconds
const callbackManager = new CallbackManager(callbacks, customTimeout);
```

```python
custom_timeout = 10; # 10 seconds
callback_manager = CallbackManager([my_logging_callback], custom_timeout)
```

#### Error Handling

Custom callbacks should include error handling to manage exceptions. Errors thrown within callbacks are caught by the CallbackManager and can be logged or handled as needed.

## Custom metadata

You can store any kind of JSON-serializable metadata in an `aiconfig`. See the [metadata schema details](https://aiconfig.lastmileai.dev/docs/overview/ai-config-format#metadata) to learn more.

To add metadata, use the `config.setMetadata` API (available in both Python and TypeScript).
