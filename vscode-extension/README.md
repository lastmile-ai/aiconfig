# AIConfig Extension for Visual Studio Code

## Overview

AIConfig Editor is an open-source playground that supports local and remote models from OpenAI, Anthropic, Meta, Google, HuggingFace, Anyscale, and more.

![WorkbookUI](https://github.com/lastmile-ai/aiconfig/assets/25641935/963eb31b-ce0f-4aa8-89ff-7c4c78ce24c9)

This extension is built on [`aiconfig`](https://github.com/lastmile-ai/aiconfig), which is a JSON/YAML-based format for storing prompts and model generation settings.

AIConfig consists of 3 parts:

1. **AI Workbook** -- notebook editor for both local and remote model experimentation
2. **.aiconfig.json/yaml** -- the config file containing the prompts and model settings.
3. **SDK** -- Use the aiconfig file in code with the [AIConfig SDK](https://github.com/lastmile-ai/aiconfig).

Together, this turns VSCode into a generative AI prompt IDE. You can use same environment and config artifact across the playground and SDK.

### Quick Start

1. Install the [AIConfig Editor extension](https://marketplace.visualstudio.com/items?itemName=lastmile-ai.vscode-aiconfig).
2. Create a .env file with your API keys: e.g. `OPENAI_API_KEY='your-key’`
3. Open Command Palette (`Ctrl`+`Shift`+`P`) and select `AIConfig: Create New` to launch an Untitled aiconfig.

## Key Features

- **Stay in flow**. Access all generative AI models in a single place, directly in your IDE.
- **Universal notebook playground**. Swap between models, chain models together, and create prompt templates.
- **Access local and remote models in one place**. Out-of-the-box support for text, image, and audio models.
- **Version control prompts**. Manage prompts right beside your code.
- **Connect to your own models and endpoints**. [Extend AIConfig](https://aiconfig.lastmileai.dev/docs/extensibility) to work with any model and endpoint.

## Supported Models

This extension supports all major foundation models from major model providers.

For more details, please see https://aiconfig.lastmileai.dev/docs/overview/model-parsers/.

| Provider                          | Model                                                                                                        | Language | Support                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------- |
| OpenAI                            | **GPT3.5**                                                                                                   | Python   | ✅ Built-in                                                                                                 |
| OpenAI                            | **GPT4**                                                                                                     | Python   | ✅ Built-in                                                                                                 |
| OpenAI                            | **Dall-E 3**                                                                                                 | Python   | ✅ Built-in                                                                                                 |
| Azure OpenAI                      | **GPT3.5, GPT4**                                                                                             | Python   | ✅ Built-in                                                                                                 |
| AWS Bedrock                       | **Claude**                                                                                                   | Python   | ✅ Built-in                                                                                                 |
| HuggingFace Inference Endpoints   | **Text Generation, Text-to-image, Text-to-speech, Summarization, Translation, Automatic Speech Recognition** | Python   | ✅ Built-in                                                                                                 |
| Google                            | **PaLM 2**                                                                                                   | Python   | ✅ Built-in                                                                                                 |
| Google                            | **Gemini**                                                                                                   | Python   | ✅ Built-in                                                                                                 |
| Meta                              | **Llama 2**                                                                                                  | Python   | 🤝 [Extension](https://github.com/lastmile-ai/aiconfig/tree/main/extensions/llama/python)                   |
| Meta                              | **Llama Guard**                                                                                              | Python   | 🤝 [Extension](https://github.com/lastmile-ai/aiconfig/tree/main/extensions/llama-guard)                    |
| HuggingFace Transformer Pipelines | **Text Generation**                                                                                          | Python   | 🤝 [Extension](https://github.com/lastmile-ai/aiconfig/tree/main/extensions/HuggingFaceTransformers/python) |
