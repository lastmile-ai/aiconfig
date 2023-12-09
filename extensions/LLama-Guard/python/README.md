# LLama Guard with AIConfig

LLama Guard is a 7b model released by Meta. This extension allows you to use it with AIConfig.
Note: This extension also loads the entire model into memory.

## Usage

### Installation, Importing, and using this extension

1. run `pip install aiconfig_extension_llama_guard` in your shell
2. `from aiconfig_extension_llama_guard import LLamageGuard`
3. In code, construct and load the model parser that to from this extension to the registry: `ModelParserRegistry.register_model_parser(LLamageGuard())`. You can read the docstrings under `ModelParserRegistry` class for more info


## Local Testing
### Update and test this extention

1. Navigate to `extensions/LLama-Guard/python`, run this command: `pip install build && cd python && python -m build && pip install dist/*.whl`
2. After you're done testing, be sure to delete the generated `dist` folder(s) in the same dir. It'll probalby look something like `python/dist` and `python/<package_name>.egg-info`

