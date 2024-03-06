This extension contains the Groq client wrapper to use with AIConfig so you can use models supported by the [GroqAPI](https://console.groq.com/docs/quickstart).

## Step 1: Set your Groq API key

1. Create an API key from the Groq [website](https://console.groq.com/keys).
2. Add the key to your home `~/env` file: `GROQ_API_KEY='<your-api-key>'`

## Step 2: Import the Groq Extension

1.  `pip3 install aiconfig-extension-groq`
2.  Add this file [`aiconfig_model_registry.py`](https://github.com/lastmile-ai/aiconfig/blob/main/cookbooks/Groq/aiconfig_model_registry.py) in your working directory.

NOTE: When new models are supported by the GroqAPI that you want to use, make sure to manually add them to this file (similar to how `mixtral-8x7b-32768` was registered for example).

## Step 2: Use models from Groq in AIConfig

Make sure you have AIConfig VS Code Extension installed [here](https://marketplace.visualstudio.com/items?itemName=lastmile-ai.vscode-aiconfig).

1. `CMD/Ctrl + Shift + P` and enter `'AIConfig: Create New AIConfig (yaml)'`
2. Groq models (ex. `mixtral-8x7b-32768`) will now be available via model dropdown for your prompts.
3. Run a prompt with a Groq model!

Want to start with an existing Groq AIConfig?
Open this [AIConfig file](https://github.com/lastmile-ai/aiconfig/blob/b9a9e59dfd6251ab91580c0b8a4ef37906e8b9d4/cookbooks/Groq/groq.aiconfig.json) with the AIConfig Editor. Make sure the steps above were completed.
