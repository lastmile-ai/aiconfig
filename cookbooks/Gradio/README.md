# Gradio Workbook Editor

## Prompt IDE with LastMile AI

This cookbook is meant to demonstrate the AI Workbook editor that can be run on your local machine. It can run inference against locally hosted or remote models from many inference providers, including Hugging Face, OpenAI and others.

It supports any modality, and allows chaining together different models in a single notebook interface.

With `aiconfig`, it lets you save the state in a source control friendly format which you can share with others.

And you can use the AIConfig SDK to use your generated `.aiconfig.json` in your application, providing a single interface to run inference across any model/modality/provider.

## Tech Stack

What you see here is a "local editor" -- a React frontend and a Flask server which allow you to edit `.aiconfig.json` files in a notebook-like editor.

- Frontend code:

### Gradio custom component

The Gradio custom component is currently WIP.

**Note**: We already have the Gradio backend that corresponds to the Flask server in the [`gradio-workbook`](https://github.com/lastmile-ai/gradio-workbook) repo.

We are working on using `sveltris` to package our React frontend to work with Gradio. Once that works, the same experience you see in this cookbook will be possible inside a Gradio custom component.

## Getting Started

**Instructions**:

- Clone https://github.com/lastmile-ai/aiconfig

- `pushd <aiconfig>/cookbooks/Gradio`

- `pip3 install -r requirements.txt`

- Install `python-aiconfig-test` package from `test-pypi`:

```
pip3 install --index-url https://test.pypi.org/simple --extra-index-url https://pypi.org/simple python-aiconfig-test==1.1.25 --force
```

- Run `aiconfig edit --aiconfig-path=huggingface.aiconfig.json --parsers-module-path=hf_model_parsers.py`

## TODO

- Publish new version of aiconfig_extension_hugging_face package
- Update huggingface.aiconfig.json with clean examples
- Add video demo
