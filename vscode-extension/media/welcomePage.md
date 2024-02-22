# Tutorial!

AIConfig Editor is a tool that allows you to **create, edit, and manage AIConfig files**. This acts as an open-source playground that supports local and remote models from OpenAI, Anthropic, Meta, Google, HuggingFace, Anyscale, and more.  
**Tip:** To learn more about AIConfigs and why they're useful, check out the FAQ section at the bottom of this page.

![Playing around with the editor](https://s3.amazonaws.com/lastmileai.aiconfig.public/playing_around_with_editor.png)

## Commands

Get started by trying out some of these commands! Press ("CMD" + "SHIFT" + P) to open the command palette and type in "AIConfig":

<!-- Not able to get below line to work for executing VSCode Command -->
<!-- - [`AIConfig: Create New`](command:vscode-aiconfig.createAIConfigJSON) -> Creates a new file (in JSON or YAML format) -->

- `AIConfig: Create New` -> Creates a new file (in JSON or YAML format)
- `AIConfig: Share (get permalink)` -> Creates a link to read-only state of your AIConfig file. Use this to share with others :D
- `AIConfig: Welcome` -> Opens this window that you can refer to again!

You can also open existing files that end in ".aiconfig.json" or ".aiconfig.yaml" (note that there are two periods in the filename!).  
Example: "my_cool_file.aiconfig.json"

## API Keys

Some models require API keys in order to run them. If you want to run any of the models below, please create a ".env" file in the root of your project and add the following keys:

- [GOOGLE_API_KEY](https://ai.google.dev/tutorials/setup)\=your_key_here
  - Used for Gemini
- [OPENAI_API_KEY](https://platform.openai.com/api-keys)\=your_key_here
  - Used for OpenAI models like ChatGPT and Dall-E
- [HUGGING_FACE_API_TOKEN](https://huggingface.co/settings/tokens)\=your_token_here
  - Used for any models [hosted on Hugging Face](https://huggingface.co/models)

For example, your .env file should look similar to this: ![Example .env file](https://s3.amazonaws.com/lastmileai.aiconfig.public/api_key_example.png)