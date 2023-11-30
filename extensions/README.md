# AIConfig Extensions

This is a place for creating extensions, which are additional features on top of our core library. For example, a feature may have several extra dependencies that we don't want to include in the main library.

## Instructions

1. Create a folder under `aiconfig/extensionts` (ex: `MyCoolExtension`)
2. Add a `README.md` explaining what it does
3. Create subfolder(s) `python` and/or `typescript` depending on what languages you want to support

### Python-specific

1. Add a `requirements.txt` file to add your dependencies. Pip will run `pip install -r requirements.txt` automatically so you don't have to worry about that.
2. Add a `__init__.py` file so your module can be read by the core lib
3. Testing-only: To test, go into your folder (ex: `aiconfig/extentions/MyCoolExtension`) and run `pip install build && cd python && python -m build && pip install dist/*.whl`. Check the output for the name of the module you will be importing (usually the name of the files you added). Ex: if we run this command in the `aiconfig/extentions/HuggingFaceTransformers`, pip will install the `text-generation` module and we simply need to call `import text-generation` in Python when testing locally. To see more info on testing locally, please read the `aiconfig/README_dev.md` file
