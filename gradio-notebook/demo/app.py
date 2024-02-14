import gradio as gr
from gradio_notebook import GradioNotebook

AICONFIG_FILE_PATH = "./example.aiconfig.json"  # Can also be empty or None!
with gr.Blocks() as demo:
    GradioNotebook(config_path=AICONFIG_FILE_PATH)

demo.queue().launch()
