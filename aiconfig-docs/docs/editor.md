---
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# AIConfig Editor

**AIConfig Editor** is a locally hosted playground where you can visually create and edit prompts stored as [AIConfig JSON files](./basics). The editor is `model-agnostic`, `multimodal`, and `extensible` by design - it can support any generative AI model with text, image, and audio modalities. You can quickly transition from prototype to production using the AIConfig generated from AIConfig Editor. The AIConfig SDK enables you to execute the prompts and model parameters from the AIConfig in your application code.

This guide covers the core features of AIConfig Editor and demonstrates how to:

- [Set up the Editor](#set-up)
- [Open the AIConfig Editor](#open)
- [Edit and save AIConfigs](#edit-and-save)
- [Run prompts](#run-prompts)
- [Chain prompts](#chain-prompts)
- [Create prompt templates](#prompt-templates)
- [Add custom model parsers](#custom-model-parsers)
- [Telemetry](#telemetry)
- [FAQ](#faq)

Want to get started quickly? Check out our [Getting Started Tutorial](./getting-started).

---

## Set Up {#set-up}

1. Install the [AIConfig python package](https://pypi.org/project/python-aiconfig/) to use the AIConfig editor.

<Tabs groupId="package-manager" queryString defaultValue={constants.defaultPythonPackageManager} values={constants.pythonPackageManagers}>
<TabItem value="pip">

```bash
$ pip3 install python-aiconfig
```

</TabItem>

<TabItem value="poetry">

```bash
$ poetry add python-aiconfig
```

</TabItem>

</Tabs>

:::note
You need to install the python AIConfig package to create and edit your configs using the AIConfig Editor. You can still use the AIConfig Node SDK to interact with your config in your application code.
:::

2. Setup your API Keys required by the model providers.

You will need to specify your API keys for the model providers (i.e. OpenAI, Google, HuggingFace) you plan to use. We recommend adding your API keys as [environment variables](#env-api-keys) so that they are accessible for all projects. The python library will automatically detect and use them without you having to write any code.

<details> 
    <summary>Example: Setup your OpenAI API Key as a environment variable (MacOS / Linux / Windows)</summary>
    <div>
        1. Get your OpenAI API Key: https://platform.openai.com/account/api-keys 
        2. Open Terminal
        3. Edit Bash Profile: Use the command `nano ~/.bash_profile` or `nano ~/.zshrc` (for newer MacOS versions) to open the profile file in a text editor.
        4. Add Environment Variable: In the editor, add the line below, replacing *your-api-key-here* with your actual API key:
        ```bash 
        export OPENAI_API_KEY='your-api-key-here'
        ```
        5. *[Optional] add in [Environment Variables](#env-api-keys) for your other model providers (Google, HuggingFace, Anyscale, etc.).*
        6. Save and Exit: Press `Ctrl+O` followed by `ENTER` to write the change. Then `Ctrl+X` to close the editor.
        7. Load Your Profile: Use the command `source ~/.bash_profile` or `source ~/.zshrc` to load the updated profile.
        8. Verification: Verify the setup by typing `echo $OPENAI_API_KEY` in the terminal. It should display your API key.
    </div>

</details>

## Open AIConfig Editor {#open}

You can open the AIConfig Editor from your terminal to start prompting against models (saved as AIConfigs).

1. Open Terminal
2. Run this command: `aiconfig edit`

This will open the AIConfig Editor in your default browser and in parallel create a new empty AIConfig JSON file in your current directory. Your work in the editor will be saved by default to `my_aiconfig.aiconfig.json`. Update the command to `aiconfig edit –aiconfig-path={file_path_name}` if you want to save to a specified file path.

:::note
We also support YAML in addition to JSON for the AIConfig file format.
:::

To get started, here’s an example prompt chain created in the AIConfig Editor and the corresponding AIConfig. See [Getting Started Tutorial](./getting-started) for details.

![image1](https://github.com/lastmile-ai/aiconfig/assets/129882602/3e291206-a01e-44ad-ac18-c562bdec2555)

This is saved to an [AIConfig JSON file](https://raw.githubusercontent.com/lastmile-ai/aiconfig/main/cookbooks/Getting-Started/travel.aiconfig.json).

## Edit and save AIConfigs {#edit-and-save}

If you already have an AIConfig JSON file, you can use the AIConfig Editor to visually edit the prompts and model parameters.

Open Terminal, run this command:

```bash
aiconfig edit --aiconfig-path={file_path_existing_aiconfig}
```

A new tab with the AIConfig Editor opens in your default browser with the prompts, chaining logic, and settings from the specified AIConfig populated in the editor. If the file path doesn’t exist, a new AIConfig will be created at that path and the editor will be blank.

### Saving

Your edits in AIConfig Editor will auto-save and update the AIConfig file every 15 seconds. There is also a `Save` button to manually save changes to your AIConfig.

## Run Prompts {#run-prompts}

Each cell in AIConfig Editor is used to prompt generative AI models and output responses. Editor cell features:

| Feature                          | Description                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prompt Name**                  | The name of the prompt cell which can be referenced in other cells for chaining.                                                                              |
| **Model**                        | The model you are prompting in this cell. Use the dropdown to see the available default models to AIConfig Editor.                                            |
| **Settings**                     | The settings and parameters specific to the model (i.e. system prompt, temperature). These settings will vary depending on the model selected.                |
| **Local Variables (Parameters)** | These are variables that you set to be used in the prompt via handlebars syntax. Local variables are local to the cell and cannot be accessed in other cells. |

Click ▶️ at the right of the cell to execute the prompt and see the model response.

![image3](https://github.com/lastmile-ai/aiconfig/assets/129882602/df2718ba-41e8-46ac-88f6-0ab312ecdc6b)

The outputs are saved to the AIConfig file by default.

## Chain Prompts {#chain-prompts}

You can chain your prompts via the cell reference names and handlebars syntax. For example, you can have a cell that uses GPT-4 to generate a haiku, and a GPT-3.5 cell that translates the message into a different language.

![image7](https://github.com/lastmile-ai/aiconfig/assets/129882602/22243c9e-f615-4abd-9b59-7d9f9a54bb2f)

## Create Prompt Templates {#prompt-templates}

Prompt templates allow you to scale your prompts to different data inputs without needing to constantly modify the prompt itself. To do this in AIConfig Editor, variables are used to pass in data to prompts. You can set both global variables and local variables. Global Variables can be used across all prompts defined in the editor whereas Local Variables can only be used in the prompt cell they are defined for.

**Global Variables**
You can set global variables to be used across all cells in the editor. Click on `Global Variables` at the top of the editor to expand the form to enter your global variables.

![image5](https://github.com/lastmile-ai/aiconfig/assets/129882602/9633b389-a9ae-4bbd-b9bd-5c965dbbdcaf)

**Local Variables**
You can set local variables to be used in specific cells in the editor. In the cell, expand the right pane and select `Local Variables (Parameters)`.

:::note
Local parameters will override the global parameters if they have the same name.
:::

![image6](https://github.com/lastmile-ai/aiconfig/assets/129882602/3c4408e4-be34-4b13-bddc-2dff5df88bcd)

**Creating Prompt Templates**
Prompt templates are created using [handlebars syntax](https://handlebarsjs.com/guide/) for the variables. Here is an example where `{{language}}` is defined as a global variable. You can easily change the values of the variable but keep the prompt template the same.

![image4](https://github.com/lastmile-ai/aiconfig/assets/129882602/4333b532-bc04-41c4-adcb-ce1e9c8ef8ea)

## Add Custom Model Parsers {#custom-model-parsers}

The AIConfig Editor is highly customizable and allows for custom models to be integrated into the editor. Check out our [Gradio cookbook](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Gradio) to see an example of integrating other cool model parsers like:

- text-to-image
- text-to-audio
- image-to-text
- audio-to-text
- text-summarization
- and much more!

## Telemetry {#telemetry}

AIConfig Editor collects telemetry data, which helpsd us understand how to improve the product. The telemetry helps us debug issues and prioritize new features.

**Disabling telemetry**

If you don't want to send any telemetry back to us to help the team build a better product, you can set `allow_usage_data_sharing` to `false` in the `.aiconfigrc` configuration file.

## More Resources

Check out these resources on how you can use your AIConfig created from your AIConfig Editor in your application code.

- [Getting Started Tutorial](./getting-started)
- [Github repo](https://github.com/lastmile-ai/aiconfig)
- [Cookbooks](./cookbooks)

## Coming Soon

- **Support for non-default models in Editor.** AIConfig Editor currently supports the default models available with AIConfig - see here. We will soon be adding support for non-default models via model parser extensions.

## FAQ {#faq}

### What are the Environment Variables for different model providers? {#env-api-keys}

| Environment Variable Name     | Description                                                                                    | Link                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **OPENAI_API_KEY**            | API Key for OpenAI models                                                                      | [OpenAI API Keys](https://platform.openai.com/api-keys)                            |
| **GOOGLE_API_KEY**            | API Key for Google Gemini and PaLM models                                                      | [Google API Keys](https://ai.google.dev/tutorials/setup)                           |
| **HUGGING_FACE_API_TOKEN**    | API Token for models running on [Hugging Face inference](https://huggingface.co/inference-api) | [Hugging Face User access tokens](https://huggingface.co/docs/hub/security-tokens) |
| **ANYSCALE_ENDPOINT_API_KEY** | API Key for models hosted on [Anyscale endpoints](https://www.anyscale.com/endpoints)          | [Anyscale API Keys](https://docs.endpoints.anyscale.com/guides/authenticate)       |
