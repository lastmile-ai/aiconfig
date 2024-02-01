---
sidebar_position: 7
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Gradio Workbooks

**[Gradio Workbooks](https://huggingface.co/spaces/lastmileai/gradio-workbook-template) provide an out-of-the-box playground for creating Hugging Face Spaces.**

The playground provides instant model selection, chaining of models, and templates - no setup or code required!

<div align="center">
  <picture>
    <img alt="workbook" src="https://github.com/lastmile-ai/aiconfig/assets/81494782/494523e1-23c6-4709-94cb-7ebe86873dfd" width="600"/>
  </picture>
</div>
<br/>\
Gradio Workbook unlocks new capabilities to HuggingFace Spaces users!

1. **Build apps inspired by Spaces**. Gradio Workbook spaces are backed by an `aiconfig.json` file that stores prompts and model settings. Click **Download** to get the aiconfig file for your space. Use the `aiconfig.json` in your application code with the [AIConfig SDK](https://github.com/lastmile-ai/aiconfig).
2. **Share read-only views of Spaces**. You can now share your workflow, prompts, and outputs, even as a space viewer. Check out this [space](https://huggingface.co/spaces/lastmileai/music_generator) and it's [read-only view](https://lastmileai.dev/aiconfig/cls2n2jpk00pnpe1n5xx8uub2)! Make edits to the space and click **Share Workbook** to get a read-only view of your own.

## Quickstart

### 1. Create a new space with Gradio Workbooks

- **Start with a template**. Duplicate the [Gradio Workbook Quickstart space](https://huggingface.co/spaces/lastmileai/gradio-workbook-template)
- **Create from scratch**. Create a [new Gradio SDK space](https://huggingface.co/new-space) and add these files to your space repo. To add files to your space repo, you can do so through the [Web UI](https://huggingface.co/docs/hub/repositories-getting-started#adding-files-to-a-repository-web-ui) or [terminal](https://huggingface.co/docs/hub/repositories-getting-started#terminal).
  - [app.py](https://huggingface.co/spaces/lastmileai/gradio-workbook-template/blob/main/app.py)
  - [requirements.txt](https://huggingface.co/spaces/lastmileai/gradio-workbook-template/blob/main/requirements.txt)

### 2. Design your space

- Add models and customize. Edits/changes won’t save automatically.

### 3. Lock in your edits

- Click **Download**, which downloads the `aiconfig` file. This captures the current configuration of your space.
- Rename the downloaded file to `my_app.aiconfig.json`.
- Replace `my_app.aiconfig.json` in the space repo with the downloaded one.

Anyone who visits your space will see the state represented by `my_app.aiconfig.json`.

## Examples

- [Music Playground](https://huggingface.co/spaces/lastmileai/music_generator). Make your demo more captivating with different modalities.
- [AI Story Generator](https://huggingface.co/spaces/lastmileai/ai_story_generator). Easy to chain models for a workflow like story building.
- [Stable Diffusion XL Playground](https://huggingface.co/spaces/lastmileai/sdxl_playground). Create interactive prompt templates for your model.

## Features

### Gradio Workbook Structure

Gradio Workbooks are inspired by Jupyter notebooks. Each workbook is made up of cells. The cell is associated with a model and running the cell executes your prompt on that model.

<div align="center">
  <picture>
    <img alt="workbook" src="https://github.com/lastmile-ai/aiconfig/assets/81494782/85c9953f-0cf6-4d0c-84bf-5fffa4e5bcf5" width="800"/>
  </picture>
</div>

### Parameters

Parameters are variables that you can define and pass into any cell within your workbook. You can set both **global parameters** and **local parameters**. For example, you can define parameters such as language or product in a cell like this with the handlebars syntax as shown below: `"Write a poem in {{language}} about a salesman selling {{product}}."`

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

The summarization prompt below uses the output of the story_gen prompt using handlebars syntax
(e.g `{{story_gen.output}}`)

![chaining](https://github.com/lastmile-ai/aiconfig/assets/81494782/be65e264-3734-422e-9967-35a44d77cbe7)

### Download

Click **Download** to download the `aiconfig` file that captures the current state of your space in a JSON file. Example Space and corresponding `aiconfig` file:

- [Gradio Workbook Space](https://huggingface.co/spaces/lastmileai/ai_story_generator)
- [my_app.aiconfig.json](https://huggingface.co/spaces/lastmileai/ai_story_generator/blob/main/story_gen.aiconfig.json)

There are 2 purposes of the aiconfig file.

1. **Lock in edits to your space.** Refreshing your space does not save changes. You need to upload the downloaded `aiconfig` file to your space repo to lock in the state. Make sure you name your aiconfig as `my_app.aiconfig.json` - it’s referenced in app.py.
2. **Build apps inspired by your space.** HuggingFace spaces offer cool demos, but building an app with the tested models and prompts is challenging. However, by downloading the `aiconfig` file, you can use the prompts (and models) from your space in your code with the [AIConfig SDK](https://github.com/lastmile-ai/aiconfig).

### Share Workbook

Click **Share Workbook** to get a link to a read-only version of your space! Even space viewers can showcase your prompts and model outputs with the rest of the world.

![sharing](https://github.com/lastmile-ai/aiconfig/assets/81494782/ceadc825-9df3-4192-b033-117ee1d40590)

### Build apps inspired by Spaces

You can easily build generative apps inspired by your work in Gradio Workbook Spaces! Both space creators and space viewers can download the aiconfig file to capture the state of their space.

Use the aiconfig file in your code with the [AIConfig SDK](<(https://github.com/lastmile-ai/aiconfig)>).

[AIConfig](<(https://github.com/lastmile-ai/aiconfig)>) is an open-source framework, message us on [Discord](https://discord.com/invite/xBhNKTetGx) if you feedback or questions.

## Supported Models

- **Supports models on [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index).** [Hugging Face Tasks](https://huggingface.co/tasks) supported:
  - [Text Generation](https://huggingface.co/tasks/text-generation)
  - [Summarization](https://huggingface.co/tasks/summarization)
  - [Translation](https://huggingface.co/tasks/translation)
  - [Automatic Speech Recognition (ASR)](https://huggingface.co/tasks/automatic-speech-recognition)
  - [Text-to-Speech](https://huggingface.co/tasks/text-to-speech)
  - [Text-to-Image](https://huggingface.co/tasks/text-to-image)
  - [Image-to-Text](https://huggingface.co/tasks/image-to-text)
- **Want to access other models?** Model parsers exist for local models, add them to the ModelParserRegistry in app.py. Have questions? Chat with us on [Discord](https://discord.com/invite/xBhNKTetGx).

## Community & Support

[AIConfig](https://github.com/lastmile-ai/aiconfig) is an open-source framework, we welcome your feedback and questions! Join our growing community for help, ideas, and discussions on AI.

- Bug Report or Feature Request? [File an issue.](https://github.com/lastmile-ai/aiconfig/issues)
- Chat live with us on [Discord](https://discord.com/invite/xBhNKTetGx)
- Check weekly updates on our [changelog](https://github.com/lastmile-ai/aiconfig/blob/main/CHANGELOG.md)
- Follow us on [Twitter](https://twitter.com/lastmile)
- Connect with us on [LinkedIn](https://www.linkedin.com/company/lastmile-ai/)
