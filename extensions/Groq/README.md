This extension contains the Groq client wrapper to use with AIConfig:

# Part 1: Register your API key

Create an API key from the Groq [website](https://console.groq.com/keys) and save it in your environment under the name `GROQ_API_KEY`. We recommend saving it into your home `~/.env` file, or one of your home hidden files like `~/.bashrc` or `~/.zshrc` so that you don't need to redefine it every session whenever you open a new terminal:

```bash
GROQ_API_KEY=<your-api-key-here>
```

# Part 2: Import and use this extension

`pip3 install aiconfig-extension-groq`

For the following steps below, see the [Groq cookbook](https://github.com/lastmile-ai/aiconfig/blob/b9a9e59dfd6251ab91580c0b8a4ef37906e8b9d4/cookbooks/Groq/aiconfig_model_registry.py) and associated [AIConfig file](https://github.com/lastmile-ai/aiconfig/blob/b9a9e59dfd6251ab91580c0b8a4ef37906e8b9d4/cookbooks/Groq/groq.aiconfig.json) for a reference example.

1. Import the library to your code: `from aiconfig_extension_groq import GroqOpenAIParser`.
2. Import the AIConfig model registery: `from aiconfig import ModelRegistryParser`
3. In code, add all the relevant model parser objects that you want to use from this extension to the registry. Ex: `ModelParserRegistry.register_model_parser(GroqOpenAIParser("mixtral-8x7b-32768"))`. You can read the docstrings under `ModelParserRegistry` class for more info
4. In your AIConfig file, add a field `model_parsers` with the model name you want to use and map it to the id of model parser you want to use. Ex (here both the model name and model id for this model parser are the same): https://github.com/lastmile-ai/aiconfig/blob/cddf72bba2bd011355d88f98bdd1d7385de53883/cookbooks/Groq/groq.aiconfig.json#L7-L9
5. Now whenever you call `aiconfig.run()` these model parsers will be loaded and available!

You can now use either the AIConfig SDK, VS Code extension, or local editor to use the Groq client to play around with models, modify prompts, change parameters, etc.
