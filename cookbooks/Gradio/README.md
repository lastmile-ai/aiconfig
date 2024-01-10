# Gradio Workbook Editor

## Prompt IDE with LastMile AI

This cookbook is meant to demonstrate the capabilities of our AI Workbook editor. It can run inference against locally hosted or remote models from many inference providers, including Hugging Face, OpenAI and others.

It supports text, image and audio model formats, allowing you to easily chain them together in a single notebook session!

With `aiconfig`, it lets you save the state in a single json config file which you can share with others. In addition to editing the `FILE_NAME.aiconfig.json` file through our Editor interface, you can also use the AIConfig SDK to interact with it in application code, providing a single interface to run inference across any model and modality (media formats).

## Tech Stack

What you see here is a "local editor" -- a React frontend and a Flask server which allow you to edit `.aiconfig.json` files in a notebook-like UI.

- Frontend code:

### Gradio custom component

The Gradio custom component is currently WIP.

**Note**: We already have the Gradio backend that corresponds to the Flask server in the [`gradio-workbook`](https://github.com/lastmile-ai/gradio-workbook) repo.

We are working on using `sveltris` to package our React frontend to work with Gradio. Once that works, the same experience you see in this cookbook will be possible inside a Gradio custom component.

## Getting Started

**Instructions**:

- Clone https://github.com/lastmile-ai/aiconfig
- Go back to top-level directory: `cd <aiconfig>`

- Setup an alias for "aiconfig" command:
  Go to

```bash
alias aiconfig="python -m 'aiconfig.scripts.aiconfig_cli'"
```

- `cd <aiconfig>/cookbooks/Gradio`

- `pip3 install -r requirements.txt`

- Install `python-aiconfig-test` package from `test-pypi`:

```
pip3 install --index-url https://test.pypi.org/simple --extra-index-url https://pypi.org/simple python-aiconfig-test==1.1.25 --force
```

No run this command to start the AIConfig editor:

```bash
aiconfig edit --aiconfig-path=huggingface.aiconfig.json --parsers-module-path=hf_model_parsers.py
```

## TODO

- Publish new version of aiconfig_extension_hugging_face package
- Update huggingface.aiconfig.json with clean examples
- Add video demo
