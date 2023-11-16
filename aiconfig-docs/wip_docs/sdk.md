---
sidebar_position: 10
---

# SDK Overview

## Model Parsers

## AIConfigRuntime

The AIConfig SDK supports CRUD operations for prompts, models, parameters and metadata. Here are some common examples.

The root interface is the `AIConfigRuntime` object. That is the entrypoint for interacting with an AIConfig programmatically.

Let's go over a few key CRUD operations to give a glimpse

### AIConfig `create`

```python
config = AIConfigRuntime.create("aiconfig name", "description")
```

### Prompt `resolve`

`resolve` deserializes an existing `Prompt` into the data object that its model expects.

```python
config.resolve("prompt_name", params)
```

`params` are overrides you can specify to resolve any `{{handlebars}}` templates in the prompt. See the `gen_itinerary` prompt in the Getting Started example.

### Prompt `serialize`

`serialize` is the inverse of `resolve` -- it serializes the data object that a model understands into a `Prompt` object that can be serialized into the `aiconfig` format.

```python
config.serialize("model_name", data, "prompt_name")
```

### Prompt `run`

`run` is used to run inference for the specified `Prompt`.

```python
config.run("prompt_name", params)
```

### `run_with_dependencies`

There's a variant of `run` called `run_with_dependencies` -- this re-runs all prompt dependencies.
For example, in [`travel.aiconfig.json`](#download-travelaiconfigjson), the `gen_itinerary` prompt references the output of the `get_activities` prompt using `{{get_activities.output}}`.

Running this function will first execute `get_activities`, and use its output to resolve the `gen_itinerary` prompt before executing it.
This is transitive, so it computes the Directed Acyclic Graph of dependencies to execute. Complex relationships can be modeled this way.

```python
config.run_with_dependencies("gen_itinerary")
```

### Updating metadata and parameters

Use the `get/setMetadata` and `get/setParameter` methods to interact with metadata and parameters (`setParameter` is just syntactic sugar to update `"metadata.parameters"`)

```python
config.setMetadata("key", data, "prompt_name")
```

Note: if `"prompt_name"` is specified, the metadata is updated specifically for that prompt. Otherwise, the global metadata is updated.

### `AIConfigRuntime.registerModelParser`

Use the `AIConfigRuntime.registerModelParser` if you want to use a different `ModelParser`, or configure AIConfig to work with an additional model.

AIConfig uses the model name string to retrieve the right `ModelParser` for a given Prompt (see `AIConfigRuntime.getModelParser`), so you can register a different ModelParser for the same ID to override which `ModelParser` handles a Prompt.

For example, suppose I want to use `MyOpenAIModelParser` to handle `gpt-4` prompts. I can do the following at the start of my application:

```python
AIConfigRuntime.registerModelParser(myModelParserInstance, ["gpt-4"])
```
