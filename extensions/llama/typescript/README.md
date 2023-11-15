# LLaMA AIConfig ModelParser Extension

## Overview

This package is a lightweight ModelParser extension for AIConfig which provides support for running local GGUF LLaMA models in AIConfig prompts. All GGUF LLaMA models from https://huggingface.co/TheBloke?search_models=gguf should be supported. Under the hood, this package leverages [node-llama-cpp](https://withcatai.github.io/node-llama-cpp/) for prompt execution.

## Install

```
yarn add aiconfig
yarn add aiconfig-extension-llama
```

## Load Models

By default, LlamaModelParser will look for .gguf models within `./models` folder relative to the running process. To use a different directory, specify the model directory when constructing the parser:

```
const parser = new LlamaModelParser(path.resolve('path', 'to', 'models'));
```

The directory must contain models meeting the following criteria:

- Must be valid GGUF format models with `.gguf` extension
- Name must contain the model name registered for use in the parser; e.g. `AIConfigRuntime.registerModelParser(llamaModelParser, ["llama-2-7b-chat"])` must have a `.gguf` file with name containing `llama-2-7b-chat`

We recommend downloading the models provided by TheBloke on HuggingFace: https://huggingface.co/TheBloke?search_models=gguf. For example, to download a few different models:

```
curl -L https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf --output ./models/llama-2-7b-chat.Q4_K_M.gguf
curl -L https://huggingface.co/TheBloke/Llama-2-13B-chat-GGUF/resolve/main/llama-2-13b-chat.Q4_K_M.gguf --output ./models/llama-2-13b-chat.Q4_K_M.gguf
curl -L https://huggingface.co/TheBloke/CodeUp-Llama-2-13B-Chat-HF-GGUF/resolve/main/codeup-llama-2-13b-chat-hf.Q4_K_M.gguf --output ./models/codeup-llama-2-13b-chat-hf.Q4_K_M.gguf
```

## Example Usage

```
const llamaModelParser = new LlamaModelParser();

AIConfigRuntime.registerModelParser(llamaModelParser, [
"llama-2-7b-chat",
]);

// A local aiconfig containing a prompt with name 'promptName' and
// model "llama-2-7b-chat"
const config = AIConfigRuntime.load("./llama-aiconfig.json");

const response = await config.run("promptName");
```
