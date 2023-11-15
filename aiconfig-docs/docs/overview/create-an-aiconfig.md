---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Create an `aiconfig`

There are 2 ways to create an `aiconfig` from scratch.

1. Using the AIConfig SDK
2. Using the AI Workbook editor

## AIConfig SDK

:::tip
Clone this [example notebook](https://github.com/lastmile-ai/aiconfig/blob/main/cookbooks/Create-AIConfig-Programmatically/create_aiconfig_programmatically.ipynb) to create an `aiconfig` for OpenAI's completion params.
:::

### Using OpenAI in Python

If you're using OpenAI chat models, you can use introspection to wrap OpenAI API calls and save an `aiconfig` automatically:

Replace

```python
import openai
```

with

```python
import openai
from aiconfig.ChatCompletion import create_and_save_to_config
openai.ChatCompletion.create = create_and_save_to_config()
```

See the [editing `aiconfig`](#programmatically) section, and this [example cookbook](https://github.com/lastmile-ai/aiconfig/blob/main/cookbooks/Create-AIConfig-Programmatically/create_aiconfig_programmatically.ipynb).

:::caution

Unless you really know the internals of the model,

:::

## AI Workbook editor

AI Workbook is a visual notebook editor for `aiconfig`.

<p align="center">
<video controls height="480" width="800">
    <source src="https://github.com/lastmile-ai/aiconfig/assets/81494782/d826b872-eab6-4245-91dc-96a509b4f5ec"/>
  </video>
</p>

:::tip
In the Jupyter world, an `ipynb` is a JSON file, but it's very rare to edit the JSON directly. Most people use the notebook editor which serializes updates into the `ipynb`.

Using an AI Workbook with an `aiconfig` is meant to satisfy the same behavior.
:::

1. Go to https://lastmileai.dev.
2. Create a new Workbook
3. Once you are done, click "..." and select 'Download as AIConfig'

Try out the workbook playground here: **[NYC Travel Workbook](https://lastmileai.dev/workbooks/clooqs3p200kkpe53u6n2rhr9)**

:::note
We are currently working on a local editor that you can run yourself. For now, please use the hosted version on https://lastmileai.dev.
:::

### Editing existing AIConfig

1. Go to https://lastmileai.dev.
2. Go to Workbooks page: https://lastmileai.dev/workbooks
3. Click dropdown from '+ New Workbook' and select 'Create from AIConfig'
4. Upload `travel.aiconfig.json`

<p align="center">
<video controls height="480" width="800">
    <source src="https://github.com/lastmile-ai/aiconfig/assets/81494782/5d901493-bbda-4f8e-93c7-dd9a91bf242e"/>
  </video>
</p>
