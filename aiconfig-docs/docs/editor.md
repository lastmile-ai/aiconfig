---
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# AIConfig Editor

**AIConfig Editor** is a locally hosted playground where you can visually create and edit prompts stored as AIConfig JSON files. The editor is `model-agnostic`, `multimodal`, and `extensible` by design - it can support any generative AI model with text, image, and audio modalities. You can quickly transition from prototype to production using the AIConfig generated from AIConfig Editor. The AIConfig SDK enables you to execute the prompts and model parameters from the AIConfig in your application code.

This guide covers the core features of AIConfig Editor and demonstrates how to:

- [Set up the Editor](#set-up)
- [Open the AIConfig Editor](#open)
- [Edit and save AIConfigs](#edit-and-save)
- [Run prompts](#run-prompts)
- [Chain prompts](#chain-prompts)
- [Create prompt templates](#prompt-templates)
- [FAQ](#faq)

Want to get started quickly? Check out our Getting Started Tutorial [add link].

---

## Set Up {#set-up}

1. Install the AIConfig python package to use the AIConfig editor.

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

:::tip
You need to install the python AIConfig package to create and edit your configs using the AIConfig Editor. You can still use the AIConfig Node SDK to interact with your config in your application code.
:::

2. Setup your API Keys required by the model providers.

You will need to specify your API keys for the model providers (i.e. OpenAI, Google, HuggingFace) you plan to use. We recommend adding your API keys as environment variables so that they are accessible for all projects. The python library will automatically detect and use them without you having to write any code.

<details> 
    <summary>Example: Setup your OpenAI API Key as a environment variable (MacOS / Linux / Windows)</summary>
    <div>
        Get your OpenAI API Key: https://platform.openai.com/account/api-keys
        Open Terminal /
        Set your environment variable in the Terminal session
        Add your api key replacing your-api-key-here

        MacOS / Linux
        export OPENAI_API_KEY='your-api-key-here'

        Windows
        set OPENAI_API_KEY='your-api-key-here'

        Saving your key across multiple sessions
        Open Terminal
        Edit Bash Profile: Use the command nano ~/.bash_profile or nano ~/.zshrc (for newer MacOS versions) to open the profile file in a text editor.
        Add Environment Variable: In the editor, add the line below, replacing your-api-key-here with your actual API key:
        export OPENAI_API_KEY='your-api-key-here'
        Save and Exit: Press Ctrl+O followed by ENTER to write the change. Then Ctrl+X to close the editor.
        Load Your Profile: Use the command source ~/.bash_profile or source ~/.zshrc to load the updated profile.
        Verification: Verify the setup by typing echo $OPENAI_API_KEY in the terminal. It should display your API key.
    </div>

</details>

## Open AIConfig Editor {#open}

You can open the AIConfig Editor from your terminal to start creating your prompt chains (saved as AIConfigs). Prompt chains are ways of connecting several prompt calls together, potentially across multiple models.

1. Open Terminal
2. Run this command: `aiconfig edit`

This will open the AIConfig Editor in your default browser and in parallel create a new empty AIConfig JSON file in your current directory. Your work in the editor will be saved by default to `my_aiconfig.aiconfig.json`. Update the command to `aiconfig edit –{file_path_name}` if you want to save to a specified file path (i.e. YAML format).

AIConfig Editor is inspired by Jupyter notebooks and is made up of prompt cells. A prompt cell is used to prompt generative AI models and output responses. Based on the model selected for a cell, you can access model settings and parameters such as system prompt, temperature, etc. You can also chain prompts and use global and local variables in your prompts. These features are explained in detail in later sections.

Here’s an example prompt chain created in the AIConfig Editor and the corresponding AIConfig. See Getting Started Tutorial [add link] for details.

This is saved to an AIConfig JSON file - shown below.
[Code Block - travel.aiconfig.json]

## Edit and save AIConfigs {#edit-and-save}

If you already have an AIConfig JSON/YAML, you can use the AIConfig Editor to visually edit the prompts and model parameters.
Open Terminal
Run this command: `aiconfig edit --aiconfig-path {file_path_existing_aiconfig}`

A new tab with the AIConfig Editor opens in your default browser with the prompts, chaining logic, and settings from the specified AIConfig populated in the editor. If the file path doesn’t exist, a new AIConfig will be created at that path and the editor will be blank.

Saving
Your edits in AIConfig Editor will auto-save and update the AIConfig file every 15 seconds. There is also a `Save` button to manually save changes to your AIConfig.

## Run Prompts {#run-prompts}

Each cell in AIConfig Editor is used to prompt generative AI models and output responses. Cell features:

- **Prompt Name**: The name of the prompt cell which can be referenced in other cells for chaining.
- **Model**: The model you are prompting in this cell. Use the dropdown to see the available default models to AIConfig Editor.
- **Settings**: The settings and parameters specific to the model (i.e. system prompt, temperature). These settings will vary depending on the model selected.
- **Local Variables (Parameters)**: These are variables that you set to be used in the prompt via handlebars syntax. Local variables are local to the cell and cannot be accessed in other cells.

Click **Play Button** to execute the prompt and see the model response. Support for streaming responses is coming soon!

The outputs are saved to the AIConfig file by default.

## Chain Prompts {#chain-prompts}

You can chain your prompts via the cell reference names and handlebars syntax. For example, you can have a cell that uses GPT-4 to generate a haiku, and a GPT-3.5 cell that translates the message into a different language.

## Create Prompt Templates {#prompt-templates}

Prompt templates allow you to scale your prompts to different data inputs without needing to constantly modify the prompt itself. To do this in AIConfig Editor, variables are used to pass in data to prompts. You can set both global variables and local variables. Global Variables can be used across all prompts defined in the editor whereas Local Variables can only be used in the prompt cell they are defined for.

**Global Variables**
You can set global variables to be used across all cells in the editor. Click on `Global Variables` at the top of the editor to expand the form to enter your global variables.

**Local Variables**
You can set local variables to be used in specific cells in the editor. In the cell, expand the right pane and select `Local Variables (Parameters)`. Local parameters will override the global parameters if they have the same name.

**Creating Prompt Templates**
Prompt templates are created using handlebars syntax for the variables. Here is an example where `{{language}}` is defined as a global variable. You can easily change the values of the variable but keep the prompt template the same.

## More Resources

Check out these resources on how you can use your AIConfig created from your AIConfig Editor in your application code.
Getting Started Tutorial
AIConfig API Reference
Cookbooks

## Coming Soon

- **Streaming model responses in Editor.** Streaming is the printing or processing of the beginning of the completion before the full completion is finished.
- **Support for non-default models in Editor.** AIConfig Editor currently supports the default models available with AIConfig - see here. We will soon be adding support for non-default models via model parser extensions.
