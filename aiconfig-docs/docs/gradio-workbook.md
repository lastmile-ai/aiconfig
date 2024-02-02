---
sidebar_position: 7
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Gradio Workbooks

[Gradio Workbooks](https://huggingface.co/spaces/lastmileai/gradio-workbook-template) is a Gradio custom component that creates a notebook playground on Hugging Face Spaces with only [8-lines of code](https://huggingface.co/spaces/lastmileai/gradio-workbook-template/blob/main/app.py)! 

You can:
* Use any model, and a combination of models, in a single space
* Play around with models in any format (text, audio image) and ordering
* Share Space output results with friends

<div align="center">
  <picture>
    <img alt="workbook" src="https://github.com/lastmile-ai/aiconfig/assets/81494782/1af66044-5eea-497c-964d-110933386154" width="600"/>
  </picture>
</div>
<br/>

## Quickstart

### 1. Create a new Space with Gradio Workbooks

- **Option 1: Start with a template**. Duplicate the [Gradio Workbook Quickstart Space](https://huggingface.co/spaces/lastmileai/gradio-workbook-template).
- **Option 2: Create from scratch**. Create a [new Gradio SDK Space](https://huggingface.co/new-space) and add these files to your Space repo. To add files to your Space repo, you can do so through the [Web UI](https://huggingface.co/docs/hub/repositories-getting-started#adding-files-to-a-repository-web-ui) or [terminal](https://huggingface.co/docs/hub/repositories-getting-started#terminal).
  - [app.py](https://huggingface.co/spaces/lastmileai/gradio-workbook-template/blob/main/app.py)
  - [requirements.txt](https://huggingface.co/spaces/lastmileai/gradio-workbook-template/blob/main/requirements.txt)

### 2. Design your Space
Use the playground UI in your space to setup your models and prompts that you want on your space.

- **Add a new cell with '+'.** Gradio Workbooks are made up cells. Each cell allows you to prompt a specific model.
- **Select the model for your cell.** First, choose the [Hugging Face Task](#supported-models) for this cell. Then, click on the Cell Settings panel to select a model for that task. The model needs to available on the [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index) - check the model card on Hugging Face.
- **Note: Edits/changes won’t save automatically.** Refreshing the page will lose your edits.

### 3. Lock in your edits

- Click **Download**. This captures the current configuration of your Space and downloads the `aiconfig.json` file onto your computer.
- Rename the downloaded file to `my_app.aiconfig.json`.
- Replace `my_app.aiconfig.json` in the Space repo with the downloaded one.

Anyone who now visits your Space will see the state represented by `my_app.aiconfig.json`.

## Examples

- [Music Playground](https://huggingface.co/spaces/lastmileai/music_generator): Implement various media formats (e.g. text, audio, image) for multi-modal models.
- [AI Story Generator](https://huggingface.co/spaces/lastmileai/ai_story_generator): Chain models and prompts together to create workflows, such as story building.
- [Stable Diffusion XL Playground](https://huggingface.co/spaces/lastmileai/sdxl_playground): Create interactive prompt templates for your model.

## Features

### Gradio Workbook Structure

Gradio Workbooks are inspired by [Jupyter notebooks](https://jupyter.org/). Each workbook is made up of cells. The cell is associated with a model and running the cell executes it with your prompt.

<div align="center">
  <picture>
    <img alt="workbook" src="https://github.com/lastmile-ai/aiconfig/assets/81494782/85c9953f-0cf6-4d0c-84bf-5fffa4e5bcf5" width="800"/>
  </picture>
</div>

### Parameters

Parameters are variables that you can define and pass into any cell within your workbook. You can set both **global parameters** and **local parameters**.

For example, the prompt `"A large, friendly {{animal}} wearing a {{color}} hat"` generates the following images for different parameters:

<div align="center">
  <picture>
    <img alt="workbook" src="https://github.com/lastmile-ai/aiconfig/assets/81494782/9a7a11fe-6cc0-44f2-b7a3-c2efca87079b" width="600"/>
  </picture>
</div>

#### Global Parameters

You can set global parameters for your entire workbook. Click on **Global Parameters {}** on the top of your workbook and set your global parameters that can be used in any cell of the workbook.

<div align="center">
  <picture>
    <img alt="workbook" src="https://github.com/lastmile-ai/aiconfig/assets/81494782/631f33ac-cf66-4e40-a7aa-c28d37b2ffad" width="800"/>
  </picture>
</div>

#### Local Parameters

You can set local parameters that only apply to the cell you are in. Click on the cell sidebar and **Local Parameters**. Note: Local parameters will override the global parameters if they have the same name.

<div align="center">
  <picture>
    <img alt="workbook" src="https://github.com/lastmile-ai/aiconfig/assets/81494782/0935ac7c-5e68-42f1-befe-e279b027cac8" width="800"/>
  </picture>
</div>

### Chaining

You can reference the output from one cell in another cell. This allows you to create complex, interconnected workflows within your workbook.

The image_gen prompt below uses the output of the prompt_1 using handlebars syntax
(e.g `{{prompt_1.output}}`)

<div align="center">
  <picture>
    <img alt="workbook" src="https://github.com/lastmile-ai/aiconfig/assets/81494782/78636283-79d3-43b9-ab13-d0cd1513b38f" width="800"/>
  </picture>
</div>

### Download

Click **Download** to download the `aiconfig.json` file that captures the current state of your Space. Example Space and corresponding `aiconfig.json` file:

- [Gradio Workbook Space](https://huggingface.co/spaces/lastmileai/ai_story_generator)
- [my_app.aiconfig.json](https://huggingface.co/spaces/lastmileai/ai_story_generator/blob/main/story_gen.aiconfig.json)

Reasons for Downloading:

1. **Lock in edits to your Space.** Refreshing your Space does not save changes. You need to upload the downloaded `aiconfig.json` file to your Space repo to lock in the state. Make sure you name your `aiconfig.json` file as `my_app.aiconfig.json` - it’s referenced in `app.py`.
2. **Build apps inspired by your Space.** HuggingFace Spaces offer cool demos, but building an app with the tested models and prompts is challenging. However, by downloading the `aiconfig.json` file, you can use the prompts (and models) from your Space in your code with the [AIConfig SDK](https://github.com/lastmile-ai/aiconfig).

### Share Workbook

Click **Share Workbook** to get a link to a read-only copy of your Space to share with the rest of the world!

![sharing](https://github.com/lastmile-ai/aiconfig/assets/81494782/ceadc825-9df3-4192-b033-117ee1d40590)

### Build apps inspired by Spaces

You can easily build generative apps inspired by your work in Gradio Workbook Spaces! Both Space creators and Space viewers can download the `aiconfig.json` file to capture the state of their Space.

Use the `aiconfig.json` file in your code with the [AIConfig SDK](https://github.com/lastmile-ai/aiconfig) in 2 lines.

```python
config = await AIConfigRuntime.load('my_app.aiconfig.json')
model_output = await config.run('prompt_1')
```

[AIConfig](https://github.com/lastmile-ai/aiconfig) is an open-source framework. Message us on [Discord](https://discord.com/invite/xBhNKTetGx) if you feedback or questions!

## Supported Models

- **Gradio Workbooks support models which use the [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index).** [Hugging Face Tasks](https://huggingface.co/tasks) that are supported:
  - [Text Generation](https://huggingface.co/tasks/text-generation)
  - [Summarization](https://huggingface.co/tasks/summarization)
  - [Translation](https://huggingface.co/tasks/translation)
  - [Automatic Speech Recognition (ASR)](https://huggingface.co/tasks/automatic-speech-recognition)
  - [Text-to-Speech](https://huggingface.co/tasks/text-to-speech)
  - [Text-to-Image](https://huggingface.co/tasks/text-to-image)
  - [Image-to-Text](https://huggingface.co/tasks/image-to-text)
- **Want to access other models?** Model parsers exist for local models, add them to the `ModelParserRegistry` in `app.py`. Have questions? Chat with us on [Discord](https://discord.com/invite/xBhNKTetGx).

## Community & Support

[AIConfig](https://github.com/lastmile-ai/aiconfig) is an open-source framework, we welcome your feedback and questions! Join our growing community for help, ideas, and discussions on AI.

- Bug Report or Feature Request? [File an issue](https://github.com/lastmile-ai/aiconfig/issues)
- Chat live with us on [Discord](https://discord.com/invite/xBhNKTetGx)
- Check weekly updates on our [Changelog](https://github.com/lastmile-ai/aiconfig/blob/main/CHANGELOG.md)
- Follow us on [Twitter](https://twitter.com/lastmile)
- Connect with us on [LinkedIn](https://www.linkedin.com/company/lastmile-ai/)
