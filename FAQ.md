# Frequently Ased Questions (FAQ)

### How should I edit an `aiconfig` file?

Editing a configshould be done either programmatically via SDK or via the UI (workbooks):

- [Programmatic](https://github.com/lastmile-ai/aiconfig/blob/main/cookbooks/Create-AIConfig-Programmatically/create_aiconfig_programmatically.ipynb) editing.

- [Edit with a workbook](#edit-aiconfig-in-a-notebook-editor) editor: this is similar to editing an ipynb file as a notebook (most people never touch the json ipynb directly)

You should only edit the `aiconfig` by hand for minor modifications, like tweaking a prompt string or updating some metadata.

### Does this support custom endpoints?

Out of the box, AIConfig already supports all OpenAI GPT\* models, Google’s PaLM model and any “textgeneration” model on Hugging Face (like Mistral). See [Supported Models](#supported-models) for more details.

Additionally, you can install `aiconfig` [extensions](https://github.com/lastmile-ai/aiconfig/tree/main/extensions) for additional models (see question below).

### Is OpenAI function calling supported?

Yes. [This example](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Function-Calling-OpenAI) goes through how to do it.

We are also working on adding support for the Assistants API.

### How can I use aiconfig with my own model endpoint?

Model support is implemented as “ModelParser”s in the AIConfig SDK, and the idea is that anyone, including you, can define a ModelParser (and even publish it as an extension package).

All that’s needed to use a model with AIConfig is a ModelParser that knows

- how to serialize data from a model into the aiconfig format
- how to deserialize data from an aiconfig into the type the model expects
- how to run inference for model.

For more details, see [Extensibility](https://aiconfig.lastmileai.dev/docs/extensibility).

### When should I store outputs in an `aiconfig`?

The `AIConfigRuntime` object is used to interact with an aiconfig programmatically (see [SDK usage guide](#aiconfig-sdk)). As you run prompts, this object keeps track of the outputs returned from the model.

You can choose to serialize these outputs back into the `aiconfig` by using the `config.save(include_outputs=True)` API. This can be useful for preserving context -- think of it like session state.

For example, you can use aiconfig to create a chatbot, and use the same format to save the chat history so it can be resumed for the next session.

You can also choose to save outputs to a _different_ file than the original config -- `config.save("history.aiconfig.json", include_outputs=True)`.

### Why should I use `aiconfig` instead of things like [configurator](https://pypi.org/project/configurator/)?

It helps to have a [standardized format](http://aiconfig.lastmileai.dev/docs/overview/ai-config-format) specifically for storing generative AI prompts, inference results, model parameters and arbitrary metadata, as opposed to a general-purpose configuration schema.

With that standardization, you just need a layer that knows how to serialize/deserialize from that format into whatever the inference endpoints require.

### This looks similar to `ipynb` for Jupyter notebooks

We believe that notebooks are a perfect iteration environment for generative AI -- they are flexible, multi-modal, and collaborative.

The multi-modality and flexibility offered by notebooks and [`ipynb`](https://ipython.org/ipython-doc/3/notebook/nbformat.html) offers a good interaction model for generative AI. The `aiconfig` file format is extensible like `ipynb`, and AI Workbook editor allows rapid iteration in a notebook-like IDE.

_AI Workbooks are to AIConfig what Jupyter notebooks are to `ipynb`_

There are 2 areas where we are going beyond what notebooks offer:

1. `aiconfig` is more **source-control friendly** than `ipynb`. `ipynb` stores binary data (images, etc.) by encoding it in the file, while `aiconfig` recommends using file URI references instead.
2. `aiconfig` can be imported and **connected to application code** using the AIConfig SDK.
