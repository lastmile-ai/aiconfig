# Cookbook for LLaMA AIConfig ModelParser Extension

## Overview

A short cookbook to show the use of the LlamaModelParser extension, which provides support for running local GGUF LLaMA models in AIConfig prompts.
All GGUF LLaMA models from https://huggingface.co/TheBloke?search_models=gguf should be supported.

## Install

```
pip install python-aiconfig python-aiconfig-llama
```

## Usage:

1. Prepare your model file, e.g.
   $ mkdir models
   curl -L https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf --output ./models/llama-2-7b-chat.Q4_K_M.gguf

2. Prepare your aiconfig. See cookbooks/llama/llama-aiconfig.json for example.

3. Instantiate a LLamaModelParser with the path to your local model. See ask_llama.py for example.

4. Register the LLama model parser with your model type. See ask_llama.py for example.

5. Load your AIConfig with AIConfigRuntime and call `.run()`. Also see sk_llama.py for example.
