# Cookbook for LLaMA AIConfig ModelParser Extension

## Overview

A short cookbook to show the use of the LlamaModelParser extension, which provides support for running local GGUF LLaMA models in AIConfig prompts.
All GGUF LLaMA models from https://huggingface.co/TheBloke?search_models=gguf should be supported.

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

See `ask-llama.ts` for example usage of the above models.

Run with

```
npx ts-node ask-llama.ts
```

https://github.com/lastmile-ai/aiconfig/assets/5060851/f2ecf6ce-7601-469c-aea1-5c0f776d7b73
