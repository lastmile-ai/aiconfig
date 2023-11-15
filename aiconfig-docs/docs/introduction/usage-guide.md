---
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Usage Guide

`aiconfig`s can be used in an application programmatically using the SDK, and can be created and edited with a notebook-like playground called an AI Workbook. In this guide we'll go through some of the most important pieces of AIConfig.

## Anatomy of AIConfig

### What's stored in an `aiconfig`

`aiconfig` helps you track the _signature_ of generative AI model behavior:

- **model** to run inference (e.g. gpt-4, llama2)
- **model parameters** to tune the model behavior (e.g. temperature)
- **prompts**
- **outputs** cached from previous inference runs, which can be serialized optionally.

## Using an `aiconfig`

### Run a prompt

#### Run a prompt chain

### Passing data into a prompt template

### Serialize and deserialize a prompt

### Setting metadata

### Callbacks

#### Stream callbacks

#### Event callbacks

## Creating an `aiconfig`

### Programmatically

### Visually

<p align="center">
<video controls height="480" width="800">
    <source src="https://github.com/lastmile-ai/aiconfig/assets/81494782/d826b872-eab6-4245-91dc-96a509b4f5ec"/>
  </video>
</p>

## Editing an `aiconfig`

### Programmatically

### Visually

<p align="center">
<video controls height="480" width="800">
    <source src="https://github.com/lastmile-ai/aiconfig/assets/81494782/5d901493-bbda-4f8e-93c7-dd9a91bf242e"/>
  </video>
</p>

## Customizing behavior

## Config File

## SDK

## FAQs

### Is the `aiconfig` json file meant to be edited by hand?

For quick updates (like changing a prompt string slightly, or changing a model parameter value), it should be ok for editing the `aiconfig` JSON manually.

But for proper editing, it should be done either programmatically via AIConfig SDK, or via the AI Workbooks editor.

1. Editing with SDK
   See the [editing `aiconfig`](#programmatically) section, and this [example cookbook](https://github.com/lastmile-ai/aiconfig/blob/main/cookbooks/Create-AIConfig-Programmatically/create_aiconfig_programmatically.ipynb).

2. Editing with UI

In the Jupyter world, an `ipynb` is a JSON file, but it's very rare to edit the JSON directly. Most people use the notebook editor which serializes updates into the `ipynb`.

Using an AI Workbook with an `aiconfig` is meant to satisfy the same behavior. See the [editing visually](#visually) section for more details.
