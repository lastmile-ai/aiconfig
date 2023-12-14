This extension contains AIConfig model parsers with two main subfolders:

1. `local_inference`: Loads models onto your machine and uses Hugging Face transformers and diffusors locally.
2. `remote_inference_client`: Uses Hugging Face's InferenceClient API to connect to models remotely

## Usage

### Part 1: Update and test this extention

If you are not testing locally (just using the published extension), ignore this and go to Part 2

1. From the `aiconfig/HuggingFace`, run this command: `pip install build && cd python && python -m build && pip install dist/*.whl`
2. After you're done testing, be sure to delete the generated folder(s) in the `aiconfig/HuggingFace` dir. It'll probalby look something like `python/dist` and `python/<package_name>.egg-info`

### Part 2: Importing and using this extension

1. Import the library to your code: `from aiconfig_extension_hugging_face import <EXTENSION>`.
2. Import the AIConfig model registery: `from aiconfig import ModelRegistryParser`
3. In code, add all the relevant model parser objects that you want to use from this extension to the registry. Ex: `ModelParserRegistry.register_model_parser(HuggingFaceTextGenerationTransformer())`. You can read the docstrings under `ModelParserRegistry` class for more info
4. In your AIConfig, add a field `model_parsers` with the model you want to use and the id of the extension you want to use: . Ex: https://github.com/lastmile-ai/aiconfig/blob/f1840995b7a12acba371a59ac3b8c69b3962fc68/cookbooks/Getting-Started/travel.aiconfig.json#L19-L22
5. Now whenever you call `aiconfig.run()` these model parsers will be loaded and available!
