# LLama Guard with AIConfig

LLama Guard is a 7b model released by Meta. This extension allows you to use it with AIConfig.

LLaMA Guard allows you to define your own “safety taxonomy” — custom policies to determine which interactions are safe vs. unsafe between humans (prompts) and AI models (responses). What makes this cool is that it allows you to enforce your own policies _ON TOP_ of the standard guardrails that a model ships with (instead of merely overriding them).

> [!NOTE] This extension also loads the entire model into memory.

## Part 1: Installating, Importing, and using this extension

1. Install this module: run `pip3 install aiconfig_extension_llama_guard` in terminal
2. Add these lines to your code:

```python
from aiconfig_extension_llama_guard import LLamageGuardParser
from aiconfig.registry import ModelParserRegistry
```

3. In code, construct and load the model parser that to from this extension to the registry: `ModelParserRegistry.register_model_parser(LLamageGuard())`. You can read the docstrings under `ModelParserRegistry` class for more info o nwhat this does.
4. Use the `LLamageGuard` model parser however you please. Check out our tutorial to get started ([video walkthrough](https://www.youtube.com/watch?v=XxggqoqIVdg), [Jupyter notebook](https://github.com/lastmile-ai/aiconfig/tree/v1.1.8/cookbooks/LLaMA-Guard)) You can watch our video tutorial or check our Jupyter notebook tuto

## Part 2: Updating & Developing this extension

If you are not developing this extension locally (just using the published extension), feel free to ignore this part

1. Navigate to `extensions/LLama-Guard/python` and run this command: `pip3 install -e .` (this creates a local copy of the python module which is linked to this directory)
2. Edit and test the extension as you please. Feel free to submit a push request on GitHub!
3. After you're done testing, be sure to uninstall the local link to this directory if you ever want to use the published version: `pip3 uninstall aiconfig_extension_llama_guard`
