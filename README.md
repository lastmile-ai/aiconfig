<div align="center"><picture>
  <img alt="aiconfig" src="aiconfig-docs/static/img/readme_small_logo.png" width="200"/>
</picture></div>
<br/>

<p align="center">
    <b>AIConfig - the open-source framework for building production-grade AI applications</b> <br />
</p>

<p align="center">
  <a href="https://github.com/lastmile-ai/aiconfig/actions/workflows/main_python.yml">
    <img src="https://github.com/lastmile-ai/aiconfig/actions/workflows/main_python.yml/badge.svg" alt="Python">
  </a> |
  <a href="https://github.com/lastmile-ai/aiconfig/actions/workflows/main-typescript.yml">
    <img src="https://github.com/lastmile-ai/aiconfig/actions/workflows/main-typescript.yml/badge.svg" alt="Node">
  </a> |
  <a href="https://github.com/lastmile-ai/aiconfig/actions/workflows/test-deploy-docs.yml">
    <img src="https://github.com/lastmile-ai/aiconfig/actions/workflows/test-deploy-docs.yml/badge.svg" alt="Docs">
  </a> |
  <a href="https://discord.com/invite/xBhNKTetGx">
    <img src="https://img.shields.io/badge/Discord-LastMile%20AI-Blue?color=rgb(37%2C%20150%2C%20190)" alt="Discord">
  </a> |
  <br>
  <a href="https://aiconfig.lastmileai.dev/">
    <strong> Documentation</strong>
  </a>
</p>

AIConfig is a framework that makes it easy to build generative AI applications for production. It manages generative AI prompts, models and model parameters as JSON-serializable configs that can be version controlled, evaluated, monitored and opened in a notebook playground for rapid prototyping.

It allows you to store and iterate on generative AI behavior _separately from your application code_, offering a streamlined AI development workflow.

<div style="center">
    <img src="aiconfig-docs/static/img/aiconfig_dataflow.png" alt="AIConfig flow" width="500">
</div>

**[More context here](#why-is-this-important).**

## Getting Started

```bash
# for python installation:
pip3 install python-aiconfig
# or using poetry: poetry add python-aiconfig

# for node.js installation:
npm install aiconfig
# or using yarn: yarn add aiconfig
```

Here is a sample AIConfig that uses gpt-3.5-turbo and gpt-4:

<details style="border: 1px solid #e8e8e8; padding: 10px; border-radius: 10px;">
<summary style="cursor: pointer; color: #ffffff; user-select: none; font-weight: bold; padding:5px 10px">trip_planner_aiconfig.json</summary>
<pre style="font-size: 14px; color: #444;">
<code>
{
  "name": "trip_planner",
  "schema_version": "latest",
  "metadata": {
    "models": {
      "gpt-3.5-turbo": {
        "model": "gpt-3.5-turbo",
        "top_p": 1,
        "temperature": 0
      },
      "gpt-4": {
        "model": "gpt-4",
        "top_p": 1,
        "temperature": 0,
        "system_prompt": "You are an expert travel coordinator with exquisite taste. Be concise but specific in recommendations.\n\nEmoji: Choose an emoji based on the location: \n\nOutput Format: \n## Personalized  Itinerary [emoji]\n&nbsp;\n### Morning\n[Breakfast spot and attraction]\n&nbsp;\n### Afternoon\n[Lunch spot and attraction]\n&nbsp;\n###Evening\n[Dinner spot and attraction]\n&nbsp;\n### Night\n[Dessert spot and attraction]\n\nStyle Guidelines: \nBold the restaurants and the attractions. Be structured."
      }
    },
    "default_model": "gpt-3.5-turbo",
    "parameters": {"city": "London"}
  },
  "prompts": [
    {
      "name": "get_activities", 
      "input": "Give me the top 5 fun attractions to do in {{city}}"
    },
    {
      "name": "gen_itinerary",
      "input": "Generate a one-day personalized itinerary based on : \n1. my favorite cuisine: {{cuisine}} \n2. list of activities:  {{get_activities.output}}",
      "metadata": {
        "model": {"name": "gpt-4"},
        "parameters": {"cuisine": "Malaysian"},
        "remember_chat_context": false
      }
    }
  ]
}
</code></pre>
</details>

The core SDK allows you to use your AIConfig easily in your application code.
We cover Python instructions here, for Node.js please see the detailed Getting Started guide [here](https://aiconfig.lastmileai.dev/docs/getting-started).
The example below shows python below uses `trip_planner_aiconfig.json` shared above.

[![colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1RlGQmtR0uK7OTI5nG10E219JoH2mgAQr#scrollTo=h2G7ThhyFWxg)

Resources: [Getting Started Docs](https://aiconfig.lastmileai.dev/docs/getting-started) | [YouTube Demo Video](https://www.youtube.com/watch?v=X_Z-M2ZcpjA)

```bash
# first, setup your openai key: https://platform.openai.com/api-keys
# in your CLI, set the environment variable
export OPENAI_API_KEY=my_key
```

```python
# load your AIConfig
from aiconfig import AIConfigRuntime, InferenceOptions

config = AIConfigRuntime.load("trip_planner_aiconfig.json")

# setup streaming
inference_options = InferenceOptions(stream=True)

# run a prompt
# `get_activities` prompt generates a list of activities in specified city ('london' is default)
get_activities_response = await config.run("get_activities", options=inference_options)

# run a prompt with a different parameter
# update city parameter to 'san francisco'
get_activities_response = await config.run("get_activities", params = {“city” : “san francisco”}, options=inference_options)

# run a prompt that has dependencies
# `gen_itinterary` prompt generates itinerary based the output from `get_activities` prompt and user's specified cuisine
await config.run("gen_itinerary", params = {"cuisine" : "russian"}, run_with_dependencies=True)

# save the aiconfig to disk. and serialize outputs from the model run
config.save('updated_aiconfig.json', include_outputs=True)
```

### Edit the AIConfig in a notebook editor

We can iterate on an AIConfig using a notebook editor called an AI Workbook.

1. Go to https://lastmileai.dev.
2. Go to Workbooks page: https://lastmileai.dev/workbooks
3. Click dropdown from '+ New Workbook' and select 'Create from AIConfig'
4. Upload `trip_planner_aiconfig.json`

https://github.com/lastmile-ai/aiconfig/assets/81494782/5d901493-bbda-4f8e-93c7-dd9a91bf242e

## Why is this important?

Today, application code is tightly coupled with the gen AI settings for the application -- prompts, parameters, and model-specific logic is all jumbled in with app code.

- results in increased complexity
- makes it hard to iterate on the prompts or try different models easily
- makes it hard to evaluate prompt/model performance

AIConfig helps unwind complexity by separating prompts, model parameters, and model-specific logic from your application.

- simplifies application code -- simply call `config.run()`
- open the `aiconfig` in a playground to iterate quickly
- version control and evaluate the `aiconfig` - it's the AI artifact for your application.

## Features

- **Prompts as Configs**: [standardized JSON format](https://aiconfig.lastmileai.dev/docs/overview/ai-config-format) to store prompts and model settings in source control.
- **Editor for Prompt Chains**: Prototype and iterate on your prompt chains and model settings in [AI Workbooks](https://lastmileai.dev/workbooks/clooqs3p200kkpe53u6n2rhr9).
- **Model-agnostic and multimodal SDK**: Python & Node SDKs to use `aiconfig` in your application code. AIConfig is designed to be **model-agnostic** and **multi-modal**, so you can extend it to work with any generative AI model, including text, image and audio.
- **Extensible**: Extend AIConfig to work with any model and your own endpoints.
- **Collaborative Development**: AIConfig enables different people to work on prompts and app development, and collaborate together by sharing the `aiconfig` artifact.

## Use cases

AIConfig makes it easy to work with complex prompt chains, various models, and advanced generative AI workflows. Start with these recipes and access more in [`/cookbooks`](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks):

- [RAG with AIConfig](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/RAG-with-AIConfig)
- [Function Calling with OpenAI](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Function-Calling-OpenAI)
- [CLI Chatbot](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Wizard-GPT)
- [Prompt Routing](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Basic-Prompt-Routing)
- [Multi-LLM Consistency](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Multi-LLM-Consistency)
- [Safety Guardrails for LLMs - LLama Guard](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/LLaMA-Guard)
- [Chain-of-Verification](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Chain-of-Verification)

## Schema

[AIConfig Schema](https://aiconfig.lastmileai.dev/docs/overview/ai-config-format/)

## Supported Models

AIConfig supports the following models out of the box. See examples:

- [OpenAI models (GPT-3, GPT-3.5, GPT-4, DALLE3)](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Function-Calling-OpenAI)
- [Gemini](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Gemini)
- [LLaMA](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/llama)
- [LLaMA Guard](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/LLaMA-Guard)
- [Google PaLM models (PaLM chat)](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Multi-LLM-Consistency)
- [Hugging Face Text Generation Task models (Ex. Mistral-7B)](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/HuggingFace)

If you need to use a model that isn't provided out of the box, you can implement a `ModelParser` for it.
See [instructions](https://aiconfig.lastmileai.dev/docs/extensibility#1-bring-your-own-model) on how to support a new model in AIConfig.

## Extensibility

AIConfig is designed to be customized and extended for your use-case. The [Extensibility](/docs/extensibility) guide goes into more detail.

Currently, there are 3 core ways to extend AIConfig:

1. [Supporting other models](https://aiconfig.lastmileai.dev/docs/extensibility#1-bring-your-own-model) - define a ModelParser extension
2. [Callback event handlers](https://aiconfig.lastmileai.dev/docs/extensibility#2-callback-handlers) - tracing and monitoring
3. [Custom metadata](https://aiconfig.lastmileai.dev/docs/extensibility#3-custom-metadata) - save custom fields in `aiconfig`

## Contribute to AIConfig

We are rapidly developing AIConfig! We welcome PR contributions and ideas for how to improve the project.

- [Join the conversation on Discord](https://discord.com/invite/xBhNKTetGx) - `#aiconfig` channel
- [Open an issue for feature requests](https://github.com/lastmile-ai/aiconfig/issues)
- [Read our contributing guide](https://aiconfig.lastmileai.dev/docs/contributing/)

## Latest Updates

We currently release new tagged versions of the `pypi` and `npm` packages every week. Hotfixes go out when completed.

- [Changelog](https://github.com/lastmile-ai/aiconfig/blob/main/CHANGELOG.md): Check out our latest updates.
- [Roadmap](https://aiconfig.lastmileai.dev/docs/roadmap): What we're building next - please feel free to contribute. See our contributing guide [here](<(https://aiconfig.lastmileai.dev/docs/contributing/)>).
