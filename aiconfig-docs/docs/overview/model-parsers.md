---
sidebar_position: 10
---

# Supported Models

| Provider | Model | Language | Support |  
| --- | --- | ---| --- | 
| OpenAI | **GPT3.5** | Python | ✅ Built-in | 
| OpenAI | **GPT3.5** | Typescript | ✅ Built-in |
| OpenAI | **GPT4** | Python | ✅ Built-in |
| OpenAI | **GPT4** | Typescript | ✅ Built-in |
| OpenAI | **Dall-E 3** | Python | ✅ Built-in |
| HuggingFace Inference Endpoints | **Text Generation** | Python | ✅ Built-in |
| HuggingFace Inference Endpoints | **Text Generation** | Typescript | ✅ Built-in |
| Google | **PaLM 2** | Python | ✅ Built-in |
| Google | **PaLM 2** | Typescript | ✅ Built-in |
| Google | **Gemini** | Python | ✅ Built-in |
| Meta | **Llama 2** | Python | 🤝 [Extension](https://github.com/lastmile-ai/aiconfig/tree/main/extensions/llama/python) |
| Meta | **Llama 2** | Typescript | 🤝 [Extension](https://github.com/lastmile-ai/aiconfig/tree/main/extensions/llama/typescript) |
| Meta | **Llama Guard** | Python | 🤝 [Extension](https://github.com/lastmile-ai/aiconfig/tree/main/extensions/llama/typescript) |
| HuggingFace Transformer Pipelines | **Text Generation** | Python | 🤝 [Extension](https://github.com/lastmile-ai/aiconfig/tree/main/extensions/HuggingFaceTransformers/python) |

:::info
We plan on keeping core `aiconfig` lightweight so it doesn't become a monolithic project. We recommend using AIConfig extensions to expand support for additional models and functionality.
:::

# Custom Models

Don't see your model supported? See the [**Extensibility**](/docs/extensibility) section to learn how to add your own model parser.
