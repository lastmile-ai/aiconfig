<div align="center"><picture>
  <img alt="aiconfig" src="https://github.com/lastmile-ai/aiconfig/assets/81494782/d94f4f67-466a-4207-a46b-069f260e6ef4"/>
</picture></div>
<br/>

<p align="center">
    <b>AIConfig - the open-source framework for building production-grade AI applications!</b> <br />
    Save your prompts, models, and model parameters separately from your application code for improved collaboration, better management, and a faster path from prototype to production.
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

```bash
# for python installation:
pip3 install python-aiconfig
# or using poetry: poetry add python-aiconfig

# for node.js installation:
npm install aiconfig
# or using yarn: yarn add aiconfig
```

AIConfigs are JSON-serializable configs that store your prompts, models, and model parameters. Here is a sample AIConfig that uses gpt-3.5-turbo and gpt-4:

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

<br>

The core SDK allows you to use your AIConfig easily in your application code.
Code below uses `trip_planner_aiconfig.json` shared above.
Resources: [Getting Started Docs](https://aiconfig.lastmileai.dev/docs/getting-started) | [Google Colab](https://colab.research.google.com/drive/1RlGQmtR0uK7OTI5nG10E219JoH2mgAQr#scrollTo=h2G7ThhyFWxg) | [Demo Video](https://www.youtube.com/watch?v=X_Z-M2ZcpjA)

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
params = {“city” : “san francisco”}
get_activities_response = await config.run("get_activities", params, options=inference_options)

# run a prompt that has dependencies
# `gen_itinterary` prompt generates itinerary based the output from `get_activities` prompt and user's specified cuisine
params = {"cuisine" : "russian"}
await config.run("gen_itinerary", params, run_with_dependencies=True)

# add a new prompt to your AIConfig
gen_packing_list = Prompt(
    name="gen_packing_list",
    input="What are 5 specific things I should bring to {{city}}?",
)

config.add_prompt("gen_packing_list", gen_packing_list)
packing_list = await config.run("gen_packing_list", options=inference_options)
```

## Features

- **Prompts as configs**: a [standardized JSON format](https://aiconfig.lastmileai.dev/docs/overview/ai-config-format) to store prompt chains, model settings, and flexible metadata in source control.
- **Editor for Prompt Chains**: Quickly prototype and iterate on your prompt chains and model settings in [AI Workbooks](https://lastmileai.dev/workbooks/clooqs3p200kkpe53u6n2rhr9), a notebook-like playground for generative AI.
- **Model-agnostic SDK**: Access the latest models like gpt-4, Gemini, Mistral models, and HuggingFace models. Easily extensible to work with any generative AI model.
- **Multimodal Capabilities**: Design multimodal generative AI apps that chain text, image, and audio models together.
- **Collaboration for Teams**: Improved collaboration between devs and prompt engineers given clear abstractions of generative AI components and application code.

## Use cases

AIConfig makes it easy to work with complex prompt chains, various models, and advanced generative AI workflows. Start with these recipes and access more in [`/cookbooks`](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks):

- [RAG with AIConfig](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/RAG-with-AIConfig)
- [Multi-LLM Consistency](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Multi-LLM-Consistency)
- [CLI Chatbot](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Wizard-GPT)
- [Function Calling with OpenAI](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Function-Calling-OpenAI)
- [Safety Guardrails for LLMs - LLama Guard](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/LLaMA-Guard)
- [Prompt Routing](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Basic-Prompt-Routing)
- [Chain-of-Verification](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Chain-of-Verification)

## Why is this important?

Today application code is tightly coupled with the gen AI settings for the application -- prompts, parameters, and model-specific logic is entangled in app code.

This makes incredibly difficult to iterate on and deploy a production-grade generative AI application. Here are common issues today:

- increased complexity to iterate on prompts and model parameters
- dificulty in switching between models across providers
- limited collaboration with prompt engineers, who might be domain experts and not developers
- limited evaluation capabilities for prompt and model performance

AIConfig helps unwind complexity by separating prompts, model parameters, and model-specific logic from your application.

- simplifies application code -- simply call `config.run()`.
- open the `aiconfig` in a playground to iterate quickly. prompt engineers can start here and handoff the `aiconfig` to developers.
- version control and evaluate the `aiconfig` - it's the AI artifact for your application.

<div style="text-align:center;">
    <img src="aiconfig-docs/static/img/aiconfig_dataflow.png" alt="AIConfig flow" style="width:40%;">
</div>

## Get involved

We are rapidly developing AIConfig! We welcome PR contributors and ideas for how to improve the project.

- [Join the conversation on Discord](https://discord.com/invite/xBhNKTetGx) - `#aiconfig` channel
- [Open an issue for feature requests](https://github.com/lastmile-ai/aiconfig/issues)
- [Read our contributing guide](https://aiconfig.lastmileai.dev/docs/contributing/)

## Release Cadence

We currently release new tagged versions of the `pypi` and `npm` packages on Mondays. Hotfixes go out at any time during the week.
