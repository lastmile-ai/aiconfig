---
sidebar_position: 7
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Gradio Notebooks

[Gradio Notebook](https://huggingface.co/spaces/lastmileai/gradio-notebook-template) is a notebook component for generative AI that offers the fastest way to create a Hugging Face space ([in < 10 lines of code](<(https://huggingface.co/spaces/lastmileai/gradio-notebook-template/blob/main/app.py)>)), and a familiar notebook interface for interacting with any combination of text, image and audio models in a single space.

You can:

- Use any combination of text, image, or audio models in a single space, and even chain models together.
- Experiment with models using a pre-built notebook UI, which is a familiar, intuitive interface for multimodal interaction.
- Share space outputs with friends via a shareable URL.
- Download your space config (prompts and model settings) as an aiconfig JSON file, and use it in your application via the [AIConfig SDK](#gradio-notebook-api).

## 5-minute Video Tutorial

<div align="center">
  <iframe width="560" height="315" src="https://www.youtube.com/embed/FlwINB9RmKk?si=j6UeGZhYOpmjA678" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

## Examples

- [Music Playground](https://huggingface.co/spaces/lastmileai/music_generator): Implement various media formats (text, audio, image) for multi-modal models
- [AI Story Generator](https://huggingface.co/spaces/lastmileai/ai_story_generator): Chain models - the output of one prompt can be the input of another
- [Stable Diffusion XL Playground](https://huggingface.co/spaces/lastmileai/sdxl_playground): Feed dynamic parameters into prompt templates

<div align="center">
  <picture>
    <img alt="notebook" src="https://github.com/lastmile-ai/aiconfig/assets/81494782/1af66044-5eea-497c-964d-110933386154" width="600"/>
  </picture>
</div>
<br/>

## Start here if you are a ...

- [Hugging Face Space Creator](#for-space-creators)
- [Space Viewer](#features)
- [Developer (Gradio Notebook API)](#gradio-notebook-api)

## Features

<div align="center">
  <picture>
    ![Demo](https://s3.amazonaws.com/publicdata.lastmileai.com/Gradio_Post.gif)
  </picture>
</div>

### Gradio Notebook Structure

Gradio Notebooks are inspired by [Jupyter notebooks](https://jupyter.org/). Each Notebook is made up of prompt cells. The prompt is associated with a model and we run that model’s inference API call whenever the run button is clicked.

<div align="center">
  <picture>
    <img alt="notebook" src="https://github.com/lastmile-ai/aiconfig/assets/81494782/85c9953f-0cf6-4d0c-84bf-5fffa4e5bcf5" width="800"/>
  </picture>
</div>

### Parameters

Parameters are variables that you can define and pass into any cell within your notebook. You can set both **global parameters** and **local parameters**.

For example, the prompt `"A large, friendly {{animal}} wearing a {{color}} hat"` generates the following images for different parameters:

<div align="center">
  <picture>
    <img alt="notebook" src="https://github.com/lastmile-ai/aiconfig/assets/81494782/9a7a11fe-6cc0-44f2-b7a3-c2efca87079b" width="600"/>
  </picture>
</div>

#### Global Parameters

You can set global parameters for your entire notebook. Click on **Global Parameters {}** on the top of your notebook and set your global parameters that can be used in any cell of the notebook.

<div align="center">
  <picture>
    ![Parameters](https://github.com/lastmile-ai/aiconfig/assets/25641935/008ad009-4799-4239-9597-f13358728cb3)
  </picture>
</div>

#### Local Parameters

You can set local parameters that only apply to the cell you are in. Click on the cell sidebar and **Local Parameters**. Note: Local parameters will override the global parameters if they have the same name.

<div align="center">
  <picture>
    <img alt="notebook" src="https://github.com/lastmile-ai/aiconfig/assets/81494782/0935ac7c-5e68-42f1-befe-e279b027cac8" width="800"/>
  </picture>
</div>

### Model Chaining

You can reference the output from one cell in another cell. This allows you to create complex, interconnected workflows within your notebook.

The image_gen prompt below uses the output of the prompt_1 using handlebars syntax
(e.g `{{prompt_1.output}}`)

<div align="center">
  <picture>
    ![Chaining](https://github.com/lastmile-ai/aiconfig/assets/25641935/f0a8db93-b08e-4562-8b15-d3a586ad6b09)
  </picture>
</div>

### Download

Click the download button on the top right to download the `aiconfig.json` file to captures the current state of your Space. Here’s an example Space and corresponding `aiconfig.json` file:

- [Gradio notebook Space](https://huggingface.co/spaces/lastmileai/ai_story_generator)
- [my_app.aiconfig.json](https://huggingface.co/spaces/lastmileai/ai_story_generator/blob/main/story_gen.aiconfig.json)

Reasons for Downloading:

1. **Save your changes to your Space**

- Refreshing your Space does not save changes. You need to upload the downloaded `aiconfig.json` file to your Space repo to lock in the state. Make sure you name your `aiconfig.json` file as `my_app.aiconfig.json` - it’s referenced in `app.py`.

2. **Build apps inspired by your Space**

- HuggingFace Spaces offer cool demos, but building an app with the tested models and prompts is challenging. However, by downloading the `aiconfig.json` file, you can use the prompts (and models) from your Space in your code with the [AIConfig SDK](https://github.com/lastmile-ai/aiconfig).

### Share Notebook

Click the share button on the top right to get a link to a read-only copy of your Space to share with the rest of the world!

<div align="center">
  <picture>
    ![Sharing](https://github.com/lastmile-ai/aiconfig/assets/25641935/43df45b3-594b-402b-8ec2-79ffed1c40ef)
  </picture>
</div>

## For Space creators

### Quickstart

1. Create a new Space
2. Design your Space
3. Save your changes

### 1. Create a new Space

#### [recommended] Start with a template

Duplicate the [Gradio Notebook Quickstart Space](https://huggingface.co/spaces/lastmileai/gradio-notebook-template). Click the ⋮ symbol at the top right of the work space, then click “Duplicate this Space” and follow the instructions.

#### [manual] Create from scratch

- **Option 2: Create from scratch**. Create a [new Gradio SDK Space](https://huggingface.co/new-space) and add these files to your Space repo. To add files to your Space repo, you can do so through the [Web UI](https://huggingface.co/docs/hub/repositories-getting-started#adding-files-to-a-repository-web-ui) or [terminal](https://huggingface.co/docs/hub/repositories-getting-started#terminal).
  - [app.py](https://huggingface.co/spaces/lastmileai/gradio-notebook-template/blob/main/app.py)
  - [requirements.txt](https://huggingface.co/spaces/lastmileai/gradio-notebook-template/blob/main/requirements.txt)

:::caution
Please ensure the `sdk_version` in your Space's `README.md` is set to `sdk_version: 4.16.0` or lower due to compatibilty issues in higher `gradio` package versions. See https://huggingface.co/spaces/lastmileai/gradio-notebook-template/blob/main/README.md for example.
:::

### 2. Design your Space

Use the Gradio Notebook UI in your Space to set up models and prompts.

- Click on the '+' symbol to add a new cell
- Select the model for your cell by first choosing a [Hugging Face Task](#supported-models). Each task has a default model associated with it, but you can override it by clicking the right side of the cell and changing the “model” field. The model you change to needs to be available on the [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index) - check the model card on Hugging Face.
- Check out the [Features section](#features)

:::warning
Edits/changes won’t save automatically and refreshing the page will lose your edits.
:::

### 3. Save your changes and rebuild your space

- Click the download button on the top right. This captures the current state of your Space and downloads it as a `<filename>.aiconfig.json` file onto your computer (note that there are two periods in the filename).
- Rename the downloaded file to `my_app.aiconfig.json`.
- Replace the `my_app.aiconfig.json` in the Space repo with the one you just downloaded.

Anyone who now visits your Space will see the state represented by `my_app.aiconfig.json`.

### Supported Models

#### Inference API

**Gradio Notebooks support models which use the [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index).** [Hugging Face Tasks](https://huggingface.co/tasks) that are supported:

- [Automatic Speech Recognition (ASR)](https://huggingface.co/tasks/automatic-speech-recognition)
- [Conversational](https://huggingface.co/tasks/conversational)
- [Image-to-Text](https://huggingface.co/tasks/image-to-text)
- [Summarization](https://huggingface.co/tasks/summarization)
- [Text-to-Image](https://huggingface.co/tasks/text-to-image)
- [Text-to-Speech](https://huggingface.co/tasks/text-to-speech)
- [Text Generation](https://huggingface.co/tasks/text-generation)
- [Translation](https://huggingface.co/tasks/translation)

#### Local Models

Local models associated with most of the above tasks are also supported via Hugging Face Transformers and Diffusers library.

:::danger
Using local models will download the models to your Space, using up Space resources, even if the Space user is not an owner of the Space. Downloading the models will also require a significant wait when running a cell if they have not already been downloaded to your Space. Please be aware of these considerations when using local models. We are working on changing this behavior.
:::

These local parsers can be used by adding them to the `ModelParserRegistry` for your Space. To do so:

- add a `model_parsers.py` file in your Space repo
- in the file, import the relevant model parser from `aiconfig_extension_hugging_face`
- register the model parser in a `register_model_parsers` function

See https://huggingface.co/spaces/lastmileai/gradio_notebook_local_model/blob/main/model_parsers.py for an example `model_parsers.py` file. You can copy this file to your own Space and uncomment the desired local parsers.

Once the `model_parsers.py` file is created, simply reference it in `app.py`:

```
import gradio as gr
from gradio_notebook import GradioNotebook

with gr.Blocks() as demo:
    GradioNotebook(parsers_path="./model_parsers.py")

demo.queue().launch()
```

If a `parsers_path` is not specified for the `GradioNotebook` component, it will look for a `model_parsers.py` by default.

## Gradio Notebook API

Gradio Notebooks is built on top of the AIConfig specification which saves prompts, models settings and outputs in an `aiconfig.json` format. You can learn more about AIConfig [here](https://aiconfig.lastmileai.dev/).

AIConfig comes with a Python & Node SDK that lets you use an AIConfig file in application code. Simply download the AIConfig from a Gradio Notebook Space, and use the [AIConfig SDK](https://github.com/lastmile-ai/aiconfig) to use that AIConfig in your application.

### Build apps inspired by Spaces​

You can easily build generative apps inspired by your work in Gradio Notebook Spaces! Both Space creators and Space viewers can download the `aiconfig.json` file to capture the state of their Space.

Use the `aiconfig.json` file in your code with the [AIConfig SDK](https://github.com/lastmile-ai/aiconfig) in 2 lines:

```python
config = await AIConfigRuntime.load('my_app.aiconfig.json')
model_output = await config.run('prompt_name')
```

[AIConfig](https://github.com/lastmile-ai/aiconfig) is an open-source framework. Message us on [Discord](https://discord.com/invite/xBhNKTetGx) if you have any feedback or questions!

## Telemetry

We track event logging for error diagnostics and feature improvements, but no personal information is logged. We also do not log prompt inputs or outputs. We collect metadata to gauge aggregated metrics such as:

- number of Spaces created with Gradio Notebook components
- number of viewers and notebook interactions
- number of shares and downloads
- errors

Please visit our [open-source codebase](https://github.com/lastmile-ai/aiconfig/tree/main/gradio-notebook) to see more details.

## Community & Support

[AIConfig](https://github.com/lastmile-ai/aiconfig) is an open-source framework, we welcome your feedback and questions! Join our growing community for help, ideas, and discussions on AI.

- Bug Report or Feature Request? [File an issue](https://github.com/lastmile-ai/aiconfig/issues)
- Chat live with us on [Discord](https://discord.com/invite/xBhNKTetGx)
- Check weekly updates on our [Changelog](https://github.com/lastmile-ai/aiconfig/blob/main/CHANGELOG.md)
- Follow us on [Twitter](https://twitter.com/lastmile)
- Connect with us on [LinkedIn](https://www.linkedin.com/company/lastmile-ai/)
