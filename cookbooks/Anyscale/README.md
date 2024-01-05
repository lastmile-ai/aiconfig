# Anyscale Endpoints with AIConfig

[![colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1JgGjJ2YglyaT5GHQNswkPOyB5oHGbOcv?usp=sharing)

[Anyscale Endpoints](https://www.anyscale.com/endpoints) support optimized inference for many open source models, including the LLaMA2 family of models (7B, 13B, 70B, CodeLLaMA, LLaMA Guard) and Mistral (7B, Mixtral 8x7B).

This cookbook shows how to use any [Anyscale Endpoints](https://www.anyscale.com/endpoints) model with AIConfig using the same simple API.

We cover:

- Inference using Anyscale Endpoints
- Prompt chains with multiple models
- Function calling with Anyscale Endpoints & AIConfig

Read more about [AIConfig for prompt and model management](https://github.com/lastmile-ai/aiconfig).

## Models supported with Anyscale Endpoints

For the complete list, please see https://app.endpoints.anyscale.com/docs

- LLaMA-7B: meta-llama/Llama-2-7b-chat-hf
- LLaMA-13B: meta-llama/Llama-2-13b-chat-hf
- LLaMA-70B: meta-llama/Llama-2-70b-chat-hf
- LLaMA Guard: Meta-Llama/Llama-Guard-7b
- CodeLLaMA: codellama/CodeLlama-34b-Instruct-hf
- Mistral-7B (OpenOrca): Open-Orca/Mistral-7B-OpenOrca
- Mistral-7B: mistralai/Mistral-7B-Instruct-v0.1
- Mixtral-8x7B: mistralai/Mixtral-8x7B-Instruct-v0.1
- Zephyr: HuggingFaceH4/zephyr-7b-beta
- GTE: thenlper/gte-large
