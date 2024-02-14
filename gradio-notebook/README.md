# Gradio Notebooks

[Gradio Notebook](https://huggingface.co/spaces/lastmileai/gradio-notebook-quickstart) is a Gradio custom component that creates a notebook playground on Hugging Face Spaces with only [8-lines of code](https://huggingface.co/spaces/lastmileai/gradio-notebook-quickstart/blob/main/app.py)!

You can use this in your Hugging Face space by adding `gradio-notebook` to your Space's [`requirements.txt`](https://huggingface.co/spaces/lastmileai/gradio-notebook-quickstart/blob/main/requirements.txt) file, and then the following lines to your [`app.py`](https://huggingface.co/spaces/lastmileai/gradio-notebook-quickstart/blob/main/app.py) file:

```python
import gradio as gr
from gradio_notebook import GradioNotebook

# AICONFIG_FILE_PATH also be empty or None if you don't have an AIConfig file!
AICONFIG_FILE_PATH = "./my_app.aiconfig.json"
with gr.Blocks() as demo:
    GradioNotebook(config_path=AICONFIG_FILE_PATH)

demo.queue().launch()
```

Please see our [documentation page](https://aiconfig.lastmileai.dev/docs/gradio-notebook) for full details.

For the remaining commands for local development, please follow the
instructions from the [`README-dev.md`](https://github.com/lastmile-ai/gradio-workbook/blob/main/gradioworkbook/README-dev.md) file!
