# Using HuggingFace transformers for model parsing with AIConfig

We are prioritizing the Python library so that it can be used with the Gradio backend (which is written in Python) to support Hugging Face workspaces, which is why this is an extension and not part of the core library.

The goal is for these transformers to be used to power the model parser backends.

## Usage

### Part 1: Update and test this extention

If you are not testing locally (just using the published extension), ignore this and go to Part 2

1. From the `aiconfig/HuggingFaceTransformers`, run this command: `pip install build && cd python && python -m build && pip install dist/*.whl`
2. After you're done testing, be sure to delete the generated folder(s) in the `aiconfig/HuggingFaceTransformers` dir. It'll probalby look something like `python/dist` and `python/<package_name>.egg-info`

### Part 2: Importing and using this extension

1. Import whatever outputs pip gives from last command. For now it's `import text-generation` but this may change in the future
2. In code, add all the relevant model parsers that you want to use from this extension to the registry: `ModelParserRegistry.register_model_parser(HuggingFaceTextGenerationTransformer())`. You can read the docstrings under `ModelParserRegistry` class for more info
