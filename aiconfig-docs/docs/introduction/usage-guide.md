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
