# AIConfig Extension for Visual Studio Code

## Overview

**AIConfig Editor turns VS Code into a generative AI prompt IDE**, allowing you to run models from any provider (OpenAI, Google, Hugging Face, your local computer...) or any modality (text, image, audio) in a single universal playground.

The prompts and model settings get saved in a `.aiconfig.yaml` or `.aiconfig.json` file, which can be source controlled and used in your application code via the [AIConfig SDK](https://github.com/lastmile-ai/aiconfig).

> [Read the full documentation for more details](https://aiconfig.lastmileai.dev/docs/basics)

![EditorUI](https://github.com/lastmile-ai/aiconfig/assets/25641935/65eb14a9-bb4f-42f4-a43c-b5787c1a4e98)

[**Demo Video**](https://github.com/lastmile-ai/aiconfig/assets/25641935/a790d650-e7be-4b1b-8b99-d5854dda4ac6)

### Getting Started

#### First use

1. Install the [AIConfig Editor extension](https://marketplace.visualstudio.com/items?itemName=lastmile-ai.vscode-aiconfig).
2. Run the **AIConfig: Welcome** command (`CMD`+`SHIFT`+`P` -> `AIConfig: Welcome`), and follow the steps.
   ![Welcome](https://github.com/lastmile-ai/aiconfig/assets/25641935/78039d8a-c710-421b-8764-e272f639cbe5)
3. Check out some of our [**cookbook templates**](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks) for inspiration!

#### Next use

- Create an untitled aiconfig using the **AIConfig: Create New** command (`CMD`+`SHIFT`+`P` -> `AIConfig: Create New`) to launch an Untitled aiconfig.

## Key Features

- **Access local and remote models in one place**. Access all generative AI models in a single place, **directly in your IDE**. Out-of-the-box support for text, image, and audio models.
- **Universal prompt engineering playground**. Swap between models, chain prompts together, and create prompt templates. Use these prompts in code using the [AIConfig SDK](https://github.com/lastmile-ai/aiconfig).
- **Version control prompts**. Manage prompts and model settings in config files that you can put in source control, right beside your code.
- **Connect to your own models and endpoints**. [Extend AIConfig](https://aiconfig.lastmileai.dev/docs/extensibility) to work with any model and endpoint. See [custom models](#custom-models) section for more details.

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

## How it works

AIConfig Editor is the UI for [AIConfig](https://github.com/lastmile-ai/aiconfig), which is a [JSON/YAML schema](https://aiconfig.lastmileai.dev/docs/overview/ai-config-format) for storing generative AI prompts, models and model settings as a config file.

> For example, check out [this sample aiconfig](https://github.com/lastmile-ai/aiconfig/blob/main/cookbooks/Function-Calling-OpenAI/function-call.aiconfig.json) that handles function calling and prompt chaining.

**On install**, the extension installs the [`python-aiconfig`](https://pypi.org/project/python-aiconfig/) pip package in your Python environment.

**On open**, when you open a `*.aiconfig.yaml` file in VS Code, this extension launches a [Python server](https://github.com/lastmile-ai/aiconfig/tree/main/python/src/aiconfig/editor/server) which is running the [AIConfig SDK](https://aiconfig.lastmileai.dev/docs/overview/run-aiconfig).

As you edit and run prompts in the editor, the server uses the AIConfig SDK to run those prompts. This provides you with a lot of flexibility, because you can install additional [AIConfig Extensions](https://github.com/lastmile-ai/aiconfig/tree/main/extensions) in your Python environment, and use them in the editor.

## Extensibility and Customization

> Read [How it works](#how-it-works) for some additional context.

When you use the AIConfig Editor, the extension installs [`python-aiconfig`](https://pypi.org/project/python-aiconfig/) in your Python env. You can install additional extensions and dependencies in the same Python env, and then use them in the AIConfig Editor.

### Instructions

1. `pip3 install <extension_package>` in your python env (e.g. `pip3 install aiconfig-extension-hugging-face` for Hugging Face models via Transformers, Diffusers and Inference endpoints)
2. Run **AIConfig: Create Custom Model Registry** command (`CMD`+`SHIFT`+`P` -> `AIConfig: Create Custom Model Registry`)
   ![ModelRegistry](https://github.com/lastmile-ai/aiconfig/assets/25641935/7a1ba7df-d322-442b-a237-aaf2b1329fff)
3. Register the additional models from the package imported in Step 1. e.g.
   > [Copy the full sample](https://github.com/lastmile-ai/aiconfig/blob/65e12392c7918874518506576e584e01a0fcdd9a/cookbooks/Gradio/aiconfig_model_registry.py#L4)

```
from aiconfig_extension_hugging_face import (
    HuggingFaceText2ImageDiffusor,
    HuggingFaceTextGenerationTransformer,
    HuggingFaceTextSummarizationTransformer,
)

from aiconfig import AIConfigRuntime


def register_model_parsers() -> None:
    """Register model parsers for HuggingFace models."""

    text_to_image = HuggingFaceText2ImageDiffusor()
    AIConfigRuntime.register_model_parser(text_to_image, text_to_image.id())

    text_generation = HuggingFaceTextGenerationTransformer()
    AIConfigRuntime.register_model_parser(
        text_generation, text_generation.id()
    )
    text_summarization = HuggingFaceTextSummarizationTransformer()
    AIConfigRuntime.register_model_parser(
        text_summarization, text_summarization.id()
    )
```

4. Open an `*.aiconfig.yaml` (e.g. `CMD`+`SHIFT`+`P` -> `AIConfig: Create New`), and now you can use the custom extension in the editor!
   ![HuggingFace](https://github.com/lastmile-ai/aiconfig/assets/25641935/c8eee980-90f5-4201-9b4a-047944a4d756)

> To define you own extensions, please see [Extensibility](https://aiconfig.lastmileai.dev/docs/extensibility) docs.
