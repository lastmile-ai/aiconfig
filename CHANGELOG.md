# Changelog

## (2024-02-06) Python Version 1.1.20, NPM Version 1.1.9

Last PR included in this release: https://github.com/lastmile-ai/aiconfig/pull/1153

### Features

- **python-sdk:** Updated required python version from >=3.7 → >=3.10 ([#11146](https://github.com/lastmile-ai/aiconfig/pull/11146)). **This is a breaking change if you were previously using <=3.9**, so please update your python version if needed
- **python-sdk:** Removed explicit authorization check in Azure model parser client ([#1080](https://github.com/lastmile-ai/aiconfig/pull/1080)). **This is a breaking change if you were previously setting the api key with `client.api_key`**. You must now set the `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT`, `OPENAI_API_VERSION` and `OPENAI_API_KEY` variables in your environment
- **editor:** Built keyboard shortcut to run prompt from prompt input textbox using CTRL + Enter or SHIFT + Enter ([#1135](https://github.com/lastmile-ai/aiconfig/pull/1135))
- **editor:** Supported Markdown rendering for AIConfig description field ([#1094](https://github.com/lastmile-ai/aiconfig/pull/1094))
  [vscode extension] Created VS Code extension for AIConfig Editor ([#1075](https://github.com/lastmile-ai/aiconfig/pull/1075))
- **python-sdk:** Created methods `load_json` and `load_yaml` ([#1057](https://github.com/lastmile-ai/aiconfig/pull/1057))
  [vscode extension] Created `to_string` SDK method and server endpoint for vscode extension and local editor ([#1058](https://github.com/lastmile-ai/aiconfig/pull/1058), [#1059](https://github.com/lastmile-ai/aiconfig/pull/1059))
- **editor:** Added ability to override Mantine’s `showNotification` function with a custom callback: ([#1030](https://github.com/lastmile-ai/aiconfig/pull/1030)). Will be used in VS Code extension to use VS Code’s built-in notification framework

### Bug Fixes / Tasks

- **python-sdk:** Fixed event loop crash caused by re-running the Gemini API a 2nd time ([#1139](https://github.com/lastmile-ai/aiconfig/pull/1139))
- **editor:** Added Download button to read-only mode ([#1071](https://github.com/lastmile-ai/aiconfig/pull/1071))
- **python-sdk:** Added logic to register models and model parsers during `create()` command, not just `load()` ([#1078](https://github.com/lastmile-ai/aiconfig/pull/1078))
- **editor:** Fixed the width for the title, description, global parameters and add prompt components to match size of the rest of the prompt container components ([#1077](https://github.com/lastmile-ai/aiconfig/pull/1077), [#1081](https://github.com/lastmile-ai/aiconfig/pull/1081), [#1124](https://github.com/lastmile-ai/aiconfig/pull/1124))
- **editor:** Clarified error message when in JSON-editor mode for prompt inputs and switching between models, including how to fix it by toggling off JSON-editor mode ([#1118](https://github.com/lastmile-ai/aiconfig/pull/1118))
- **editor:** Placed + button into it’s own row to ensure it does not float above the parameters key-value pairs ([#1084](https://github.com/lastmile-ai/aiconfig/pull/1084))
- **editor:** Limited the prompt input settings height to match the size of the prompt input so it is not too large ([#1051](https://github.com/lastmile-ai/aiconfig/pull/1051))
- **editor:** Added prompt input settings schema for local Hugging Face task names ([#1110](https://github.com/lastmile-ai/aiconfig/pull/1110))
- **editor:** Removed Save button if no callback is implemented for it ([#1123](https://github.com/lastmile-ai/aiconfig/pull/1123))
- **python-sdk:** Exported missing default model parsers ([#1112](https://github.com/lastmile-ai/aiconfig/pull/1112))
- **editor:** Created separate prompt input schemas for Dall-E 2 vs. Dall-E 3 ([#1138](https://github.com/lastmile-ai/aiconfig/pull/1138))

### Documentation

- [new] Created Azure OpenAI and Claude Bedrock cookbook tutorials ([#1088](https://github.com/lastmile-ai/aiconfig/pull/1088))
- [update] Changed “Share” button to “Share Notebook” or “Share Workbook” ([#1148](https://github.com/lastmile-ai/aiconfig/pull/1148))
- [update] Fixed broken links in RAG cookbook tutorial ([#1122](https://github.com/lastmile-ai/aiconfig/pull/1122))

## (2024-01-30) Python Version 1.1.18, NPM Version 1.1.8

Last PR included in this release: https://github.com/lastmile-ai/aiconfig/pull/1060

### Features

- **python-sdk:** Created Claude model parser for Bedrock (AWS) library. Added it to core model parsers in `python-aiconfig` ([#1039](https://github.com/lastmile-ai/aiconfig/pull/1039))
- **python-sdk:** Created variant of Open AI model parser class which uses Azure endpoints. Added it to core model parsers in `python-aiconfig` ([#1034](https://github.com/lastmile-ai/aiconfig/pull/1034))
- **extension:** Created model parsers for the following HuggingFace tasks, leveraging the HuggingFace remote inference client. Added them to `aiconfig-extension-hugging-face`
  - Automatic Speech Recognition ([#1020](https://github.com/lastmile-ai/aiconfig/pull/1020))
  - Image-to-Text ([#1018](https://github.com/lastmile-ai/aiconfig/pull/1018))
  - Summarization ([#993](https://github.com/lastmile-ai/aiconfig/pull/993))
  - Text-to-Image ([#1009](https://github.com/lastmile-ai/aiconfig/pull/1009))
  - Text-to-Speech ([#1015](https://github.com/lastmile-ai/aiconfig/pull/1015))
  - Translation ([#1004](https://github.com/lastmile-ai/aiconfig/pull/1004))
- **python-sdk:** Moved Gemini model parser to the main `python-aiconfig` package. `aiconfig-extension-gemini` is now deprecated ([#987](https://github.com/lastmile-ai/aiconfig/pull/987))
- **editor:** Added Share button, which implements a callback to return a URL redirect to render a read-only version of the AIConfig instance ([#1049](https://github.com/lastmile-ai/aiconfig/pull/1049)). This will be used for Gradio Notebooks so Hugging Face space viewers can share their AIConfig session with others. We will have more details on this when it launches in upcoming weeks!
- **editor:** Added Download button, which implements a callback to download existing AIConfig session to a local file ([#1061](https://github.com/lastmile-ai/aiconfig/pull/1061)). Like the Share button, this will be implemented for Gradio Notebooks on HuggingFace spaces
- **editor:** Defined AIConfigEditor prop for setting light/dark mode UI theme ([#1063](https://github.com/lastmile-ai/aiconfig/pull/1063))
- **editor:** Added prompt input settings schemas for Hugging Face remote inference task names and Claude Bedrock ([#1029](https://github.com/lastmile-ai/aiconfig/pull/1029), [#1050](https://github.com/lastmile-ai/aiconfig/pull/1050))

### Bug Fixes / Tasks

- **python-sdk:** Fixed bug where we were not resolving parameters that referenced earlier prompts if those referenced prompts contained non-text input(s) or output(s) ([#1065](https://github.com/lastmile-ai/aiconfig/pull/1065))
- **python-sdk:** Refactored OpenAI model parser to use client object instead of directly updating api_key, enabling us create OpenAI Azure ([#999](https://github.com/lastmile-ai/aiconfig/pull/999))
- **editor:** Disabled interactions for prompt name, model selector, and model settings while in read-only mode ([#1027](https://github.com/lastmile-ai/aiconfig/pull/1027), [#1028](https://github.com/lastmile-ai/aiconfig/pull/1028))
- **editor:** Hardcode default models for remote inference HuggingFace tasks. Users can still edit the model they want to use, but they aren’t required to define them themselves ([#1048](https://github.com/lastmile-ai/aiconfig/pull/1048))
- **editor:** Set default `max_new_tokens` value from 20 → 400 for the HuggingFace remote inference Text Generation model parser ([#1047](https://github.com/lastmile-ai/aiconfig/pull/1047))
- **python-sdk:** Remove unused mocks from `serialize()` tests ([#1064](https://github.com/lastmile-ai/aiconfig/pull/1064))

### Documentation

- [new] Created cookbook for Retrieval Augmented Generation (RAG) with MongoDB Vector Search ([#1011](https://github.com/lastmile-ai/aiconfig/pull/1011))
- [updated] Fixed typos in the `aiconfig-extension-llama-guard` extension `requirements.txt` file and also improved cookbook ([#998](https://github.com/lastmile-ai/aiconfig/pull/998))

## (2024-01-23) Python Version 1.1.15, NPM Version 1.1.7

Last PR included in this release: https://github.com/lastmile-ai/aiconfig/pull/995

### Features

- **sdk:** Updated input attachments with `AttachmentDataWithStringValue` type to distinguish the data representation ‘kind’ (`file_uri` or `base64`) ([#929](https://github.com/lastmile-ai/aiconfig/pull/929)). Please note that this can [break existing SDK calls](https://github.com/lastmile-ai/aiconfig/pull/932#discussion_r1456387863) for model parsers that use non-text inputs
- **editor:** Added telemetry data to log editor usage. Users can [opt-out of telemetry](<(https://aiconfig.lastmileai.dev/docs/editor/#telemetry)>) by setting `allow_usage_data_sharing: False` in the `.aiconfigrc` runtime configuration file ([#869](https://github.com/lastmile-ai/aiconfig/pull/869), [#899](https://github.com/lastmile-ai/aiconfig/pull/899), [#946](https://github.com/lastmile-ai/aiconfig/pull/946))
- **editor:** Added CLI `rage` command so users can submit bug reports ([#870](https://github.com/lastmile-ai/aiconfig/pull/870))
- **editor:** Changed streaming format to be output chunks for the running prompt instead of entire AIConfig ([#896](https://github.com/lastmile-ai/aiconfig/pull/896))
- **editor:** Disabled run button on other prompts if a prompt is currently running ([#907](https://github.com/lastmile-ai/aiconfig/pull/907))
- **editor:** Made callback handler props optional and no-op if not included ([#941](https://github.com/lastmile-ai/aiconfig/pull/941))
- **editor:** Added `mode` prop to customize UI themes on client, as well as match user dark/light mode system preferences ([#950](https://github.com/lastmile-ai/aiconfig/pull/950), [#966](https://github.com/lastmile-ai/aiconfig/pull/966))
- **editor:** Added read-only mode where editing of AIConfig is disabled ([#916](https://github.com/lastmile-ai/aiconfig/pull/916), [#935](https://github.com/lastmile-ai/aiconfig/pull/935), [#936](https://github.com/lastmile-ai/aiconfig/pull/936), [#939](https://github.com/lastmile-ai/aiconfig/pull/939), [#967](https://github.com/lastmile-ai/aiconfig/pull/967), [#961](https://github.com/lastmile-ai/aiconfig/pull/961), [#962](https://github.com/lastmile-ai/aiconfig/pull/962))
- **eval:** Generalized params to take in arbitrary dict instead of list of arguments ([#951](https://github.com/lastmile-ai/aiconfig/pull/951))
- **eval:** Created `@metric` decorator to make defining metrics and adding tests easier by only needing to define the evaluation metric implementation inside the inner function ([#988](https://github.com/lastmile-ai/aiconfig/pull/988))
- **python-sdk:** Refactored `delete_output` to set `outputs` attribute of `Prompt` to `None` rather than an empty list ([#811](https://github.com/lastmile-ai/aiconfig/pull/811))

### Bug Fixes / Tasks

- **editor:** Refactored run prompt server implementation to use `stop_streaming`, `output_chunk`, `aiconfig_chunk`, and `aiconfig` so server can more explicitly pass data to client ([#914](https://github.com/lastmile-ai/aiconfig/pull/914), [#911](https://github.com/lastmile-ai/aiconfig/pull/911))
- **editor:** Split `RUN_PROMPT` event on client into `RUN_PROMPT_START`, `RUN_PROMPT_CANCEL`, `RUN_PROMPT_SUCCESS`, and `RUN_PROMPT_ERROR` ([#925](https://github.com/lastmile-ai/aiconfig/pull/925), [#922](https://github.com/lastmile-ai/aiconfig/pull/922), [#924](https://github.com/lastmile-ai/aiconfig/pull/924))
- **editor:** Rearranged default model ordering to be more user-friendly ([#994](https://github.com/lastmile-ai/aiconfig/pull/994))
- **editor:** Centered the Add Prompt button and fixed styling ([#912](https://github.com/lastmile-ai/aiconfig/pull/912), [#953](https://github.com/lastmile-ai/aiconfig/pull/953))
- **editor:** Fixed an issue where changing the model for a prompt resulted in the model settings being cleared; now they will persist ([#964](https://github.com/lastmile-ai/aiconfig/pull/964))
- **editor:** Cleared outputs when first clicking the run button in order to make it clearer that new outputs are created ([#969](https://github.com/lastmile-ai/aiconfig/pull/969))
- **editor:** Fixed bug to display array objects in model input settings properly ([#902](https://github.com/lastmile-ai/aiconfig/pull/902))
- **python-sdk:** Fixed issue where we were referencing `PIL.Image` as a type instead of a module in the HuggingFace `image_2_text.py` model parser ([#970](https://github.com/lastmile-ai/aiconfig/pull/970))
- **editor:** Connected HuggingFace model parser tasks names to schema input renderers ([#900](https://github.com/lastmile-ai/aiconfig/pull/900))
- **editor:** Fixed `float` model settings schema renderer to `number` ([#989](https://github.com/lastmile-ai/aiconfig/pull/989))

### Documentation

- [new] Added [docs page](https://aiconfig.lastmileai.dev/docs/editor) for AIConfig Editor ([#876](https://github.com/lastmile-ai/aiconfig/pull/876), [#947](https://github.com/lastmile-ai/aiconfig/pull/947))
- [updated] Renamed “variables” to “parameters” to make it less confusing ([#968](https://github.com/lastmile-ai/aiconfig/pull/968))
- [updated] Updated Getting Started page with quickstart section, and more detailed instructions for adding API keys ([#956](https://github.com/lastmile-ai/aiconfig/pull/956), [#895](https://github.com/lastmile-ai/aiconfig/pull/895))

## (2024-01-11) Python Version 1.1.12, NPM Version 1.1.5

We built an AIConfig Editor which is like VSCode + Jupyter notebooks for AIConfig files! You can edit the config prompts, parameters, settings, and most importantly, run them for generating outputs. Source control your AIConfig files by clearing outputs and saving. It’s the most convenient way to work with Generative AI models through a local, user interface. See the [README](https://github.com/lastmile-ai/aiconfig/tree/v1.1.8/python/src/aiconfig/editor#readme) to learn more on how to use it!

### Editor Capabilities (see linked PRs for screenshots and videos)

- Add and delete prompts ([#682](https://github.com/lastmile-ai/aiconfig/pull/682), [#665](https://github.com/lastmile-ai/aiconfig/pull/665))
- Select prompt model and model settings with easy-to-read descriptions ([#707](https://github.com/lastmile-ai/aiconfig/pull/707), [#760](https://github.com/lastmile-ai/aiconfig/pull/760))
- Modify local and global parameters ([#673](https://github.com/lastmile-ai/aiconfig/pull/673))
- Run prompts with streaming or non-streaming outputs ([#806](https://github.com/lastmile-ai/aiconfig/pull/806))
- Cancel inference runs mid-execution ([#789](https://github.com/lastmile-ai/aiconfig/pull/789))
- Modify name and description of AIConfig ([#682](https://github.com/lastmile-ai/aiconfig/pull/682))
- Render input and outputs as text, image, or audio format ([#744](https://github.com/lastmile-ai/aiconfig/pull/744), [#834](https://github.com/lastmile-ai/aiconfig/pull/834))
- View prompt input, output, model settings in both regular UI display or purely in raw JSON format ([#686](https://github.com/lastmile-ai/aiconfig/pull/686), [#656](https://github.com/lastmile-ai/aiconfig/pull/656), [#757](https://github.com/lastmile-ai/aiconfig/pull/757))
- Copy and clear prompt output results ([#656](https://github.com/lastmile-ai/aiconfig/pull/656), [#791](https://github.com/lastmile-ai/aiconfig/pull/791))
- Autosave every 15s, or press (CTRL/CMD) + S or Save button to do it manually ([#734](https://github.com/lastmile-ai/aiconfig/pull/734), [#735](https://github.com/lastmile-ai/aiconfig/pull/735))
- Edit on existing AIConfig file or create a new one if not specified ([#697](https://github.com/lastmile-ai/aiconfig/pull/697))
- Run multiple editor instances simultaneously ([#624](https://github.com/lastmile-ai/aiconfig/pull/624))
- Error handling for malformed input + settings data, unexpected outputs, and heartbeat status when server has disconnected ([#799](https://github.com/lastmile-ai/aiconfig/pull/799), [#803](https://github.com/lastmile-ai/aiconfig/pull/803), [#762](https://github.com/lastmile-ai/aiconfig/pull/762))
- Specify explicit model names to use for generic HuggingFace model parsers tasks ([#850](https://github.com/lastmile-ai/aiconfig/pull/850))

### Features

- **sdk:** Schematized prompt OutputData format to be of type string, `OutputDataWithStringValue`, or `OutputDataWithToolCallsValue` ([#636](https://github.com/lastmile-ai/aiconfig/pull/636)). Please note that [this can break existing SDK calls](https://github.com/lastmile-ai/aiconfig/pull/603#pullrequestreview-1796674430)
- **extensions:** Created 5 new HuggingFace local transformers: text-to-speech, image-to-text, automatic speech recognition, text summarization, & text translation ([#793](https://github.com/lastmile-ai/aiconfig/pull/793), [#821](https://github.com/lastmile-ai/aiconfig/pull/821), [#780](https://github.com/lastmile-ai/aiconfig/pull/780), [#740](https://github.com/lastmile-ai/aiconfig/pull/740), [#753](https://github.com/lastmile-ai/aiconfig/pull/753))
- **sdk:** Created Anyscale model parser and cookbook to demonstrate how to use it ([#730](https://github.com/lastmile-ai/aiconfig/pull/730), [#746](https://github.com/lastmile-ai/aiconfig/pull/746))
- **python-sdk:** Explicitly set `model` in completion params for several model parsers ([#783](https://github.com/lastmile-ai/aiconfig/pull/783))
- **extensions:** Refactored HuggingFace model parsers to use default model for pipeline transformer if `model` is not provided ([#863](https://github.com/lastmile-ai/aiconfig/pull/863), [#879](https://github.com/lastmile-ai/aiconfig/pull/879))
- **python-sdk:** Made `get_api_key_from_environment` non-required and able to return nullable, wrapping it around Result-Ok ([#772](https://github.com/lastmile-ai/aiconfig/pull/772), [#787](https://github.com/lastmile-ai/aiconfig/pull/787))
- **python-sdk:** Created `get_parameters` method ([#668](https://github.com/lastmile-ai/aiconfig/pull/668))
- **python-sdk:** Added exception handling for `add_output` method ([#687](https://github.com/lastmile-ai/aiconfig/pull/687))
- **sdk:** Changed run output type to be `list[Output]` instead of `Output` ([#617](https://github.com/lastmile-ai/aiconfig/pull/617), [#618](https://github.com/lastmile-ai/aiconfig/pull/618))
- **extensions:** Refactored HuggingFace text to image model parser response data into a single object ([#805](https://github.com/lastmile-ai/aiconfig/pull/805))
- **extensions:** Renamed `python-aiconfig-llama` to `aiconfig-extension-llama` ([#607](https://github.com/lastmile-ai/aiconfig/pull/607))

### Bug Fixes / Tasks

- **python-sdk:** Fixed `get_prompt_template()` issue for non-text prompt inputs ([#866](https://github.com/lastmile-ai/aiconfig/pull/866))
- **python-sdk:** Fixed core HuggingFace library issue where response type was not a string ([#769](https://github.com/lastmile-ai/aiconfig/pull/769))
- **python-sdk:** Fixed bug by adding `kwargs` to `ParameterizedModelParser` ([#882](https://github.com/lastmile-ai/aiconfig/pull/882))
- **python-sdk:** Added automated tests for` add_output()` method ([#687](https://github.com/lastmile-ai/aiconfig/pull/687))
- **python-sdk:** Updated `set_parameters()` to work if parameters haven’t been defined already ([#670](https://github.com/lastmile-ai/aiconfig/pull/670))
- **python-sdk:** Removed `callback_manager` argument from run method ([#886](https://github.com/lastmile-ai/aiconfig/pull/886))
- **extensions:** Removed extra `python` dir from `aiconfig-extension-llama-guard` ([#653](https://github.com/lastmile-ai/aiconfig/pull/653))
- **python-sdk:** Removed unused model-ids from OpenAI model parser ([#729](https://github.com/lastmile-ai/aiconfig/pull/729))

### Documentation

- [new] AIConfig Editor README: https://github.com/lastmile-ai/aiconfig/tree/main/python/src/aiconfig/editor#readme
- [new] Anyscale cookbook: https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Anyscale
- [new] Gradio cookbook for HuggingFace extension model parsers: https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Gradio
- [updated] AIConfig README: https://github.com/lastmile-ai/aiconfig/blob/main/README.md

## (2023-12-26) Python Version 1.1.8, NPM Version 1.1.2

### Features

- Added support for YAML file format in addition to JSON for improved readability of AIConfigs: ([#583](https://github.com/lastmile-ai/aiconfig/pull/583))
- **python-sdk:** Added optional param in `add_prompt()` method to specify index where to add prompt ([#599](https://github.com/lastmile-ai/aiconfig/pull/599))
- eval: Added generalized metric builder for creating your own metric evaluation class ([#513](https://github.com/lastmile-ai/aiconfig/pull/513))
- **python-sdk:** Supported using default model if no prompt model is provided ([#600](https://github.com/lastmile-ai/aiconfig/pull/600))
- **python-sdk:** Refactored `update_model()` method to take in model name and settings as separate arguments ([#507](https://github.com/lastmile-ai/aiconfig/pull/507))
- **python-sdk:** Supported additional types in Gemini model parser. Now includes list of strings, Content string, and Content struct: ([#532](https://github.com/lastmile-ai/aiconfig/pull/532))
- extensions: Added callback handlers to HuggingFace extensions ([#597](https://github.com/lastmile-ai/aiconfig/pull/597))
- **python-sdk:** Pinned `google-generativeai` to version 0.3.1 on Gemini model parser ([#534](https://github.com/lastmile-ai/aiconfig/pull/534))
- Added explicit output types to the `ExecuteResult.data` schema. Freeform also still supported ([#589](https://github.com/lastmile-ai/aiconfig/pull/589))

### Bug Fixes / Tasks

- Checked for null in system prompt ([#541](https://github.com/lastmile-ai/aiconfig/pull/541))
- Converted protobuf to dict to fix pydantic BaseModel errors on Gemini ([#558](https://github.com/lastmile-ai/aiconfig/pull/558))
- Fixed issue where we were overwriting a single prompt output instead of creating a new one in batch execution ([#566](https://github.com/lastmile-ai/aiconfig/pull/566))
- Unpinned `requests==2.30.0` dependency and using https instead of http in `load_from_workbook()` method ([#582](https://github.com/lastmile-ai/aiconfig/pull/582))
- **typescript-sdk:** Created automated test for typescript `save()` API ([#198](https://github.com/lastmile-ai/aiconfig/pull/198))

### Documentation

- OpenAI Prompt Engineering Guide: https://openai-prompt-guide.streamlit.app/
- Chain-of-Verification Demo: https://chain-of-verification.streamlit.app/

## (2023-12-18) Python Version 1.1.7, NPM Version 1.1.1

### Features

- **python-sdk:** Created model parser extension for Google’s Gemini ([#478](https://github.com/lastmile-ai/aiconfig/pull/478), [cookbook](https://github.com/lastmile-ai/aiconfig/pull/483))
- Added attachment field to PromptInput schema to support non-text input data (ex: image, audio) ([#473](https://github.com/lastmile-ai/aiconfig/pull/473))
- **python-sdk:** Created batch execution interface using `config.run_batch()` ([#469](https://github.com/lastmile-ai/aiconfig/pull/469))
- Added model parser for HuggingFace text2Image tasks ([#460](https://github.com/lastmile-ai/aiconfig/pull/460))
- Updated evaluation metric values to be any arbitrary type, not just floats, & renamed fields for easier understanding ([#484](https://github.com/lastmile-ai/aiconfig/pull/484), [#437](https://github.com/lastmile-ai/aiconfig/pull/437))
- Merged `aiconfig-extension-hugging-face-transformers` into `aiconfig-extension-hugging-face` where all Hugging Face tasks will now be supported ([#498](https://github.com/lastmile-ai/aiconfig/pull/498), [README](https://github.com/lastmile-ai/aiconfig/blob/main/extensions/HuggingFace/README.md))

### Bug Fixes

- Fixed caching issue where re-running the same prompt caused nondeterministic behavior ([#491](https://github.com/lastmile-ai/aiconfig/pull/491))
- **typescript-sdk:** Pinned OpenAI dependency to to 4.11.1 to have a stable API surface ([#524](https://github.com/lastmile-ai/aiconfig/pull/524))
- **typescript-sdk:** Removed redundant PromptWithOutputs type ([#508](https://github.com/lastmile-ai/aiconfig/pull/508))

### Documentation

- Refactored and shortened README ([#493](https://github.com/lastmile-ai/aiconfig/pull/493))
- Created table of supported models ([#501](https://github.com/lastmile-ai/aiconfig/pull/501))
- Updated cookbooks with explicit instructions on how to set API keys ([#441](https://github.com/lastmile-ai/aiconfig/pull/441))

## (2023-12-11) Python Version 1.1.5, NPM Version 1.0.8

### Features

- **python-sdk:** Evaluation harness for AIConfig. Supports text input/output evaluation with native AIConfig Interface ([tutorial](https://github.com/lastmile-ai/aiconfig/blob/9669b9e5614d5b1b0603ddf3ec61556cd79bfc14/python/src/aiconfig/eval/examples/travel/travel_eval.ipynb)) as well as an integration with Promptfoo ([tutorial](https://github.com/lastmile-ai/aiconfig/blob/main/python/src/aiconfig/eval/README.md#usage-guide---promptfoo-integration)). See [README](https://github.com/lastmile-ai/aiconfig/blob/main/python/src/aiconfig/eval/README.md) for details
- **python-sdk:** Support for PaLM Text as a core model Parser
- **typescript-sdk:** Support for PaLM Text as a core model parser ([8902bef](https://github.com/lastmile-ai/aiconfig/pull/348/commits/222bf6edf5c615b3b9b5f58b7fd5c829b2884d1b))

https://github.com/lastmile-ai/aiconfig/assets/141073967/918b4ed4-41d0-4543-a0e8-aadd257247ba

### Bug Fixes

- **python-extension** HuggingFace Transformers Extension: Fixed bug where we're not properly appending outputs for multiple return sequences ([49da477](https://github.com/lastmile-ai/aiconfig/pull/411))
- **python-extension** HuggingFace Transformers Extension: Fixed a bug that defaulted model to GPT-2. ([1c28f7c](https://github.com/lastmile-ai/aiconfig/pull/410))

### Extensions

- **python-extension:** Extension for LLama-Guard using pytorch ([86cf687](https://github.com/lastmile-ai/aiconfig/pull/438))
- - LLama Guard ([Cookbook](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/LLaMA-Guard))

## (2023-12-04) Python Version 1.1.4, NPM Version 1.0.7

### Features

- **python-sdk:** DALL-E Model Parser ([4753f21](https://github.com/openai/openai-python/commit/71a13d0c70d105b2b97720c72a1003b942cda2ae))
- **python-sdk:** Updated OpenAI Introspection Wrapper - Now more user-friendly with complete module mocking for easier import replacement, enhancing overall usability. ([143c3dd](https://github.com/lastmile-ai/aiconfig/pull/364/commits/143c3dd72b4d46e9c4f38a89492dc8404079e3d6))

### Bug Fixes

- **sdk:** Updated `add_prompt` to rename prompt name if a different name is passed in ([a29d5f87](https://github.com/lastmile-ai/aiconfig/pull/303/commits/a29d5f87198b42a46335c4f20820f02b7c3b1abf))
- **typescript-sdk:** Updated Metadata Field to be optional ([cb5fdc5](https://github.com/lastmile-ai/aiconfig/pull/320/commits/cb5fdc51a4c6797352c8c6e8b6eb6deb9fdde32b))

### Better Engineering

- **python-tests:** Higher fidelity Test script, performs a complete build for testing ([04fc5a5](https://github.com/lastmile-ai/aiconfig/pull/359/commits/04fc5a51225597382fad5fc5bbfc1e40ca2d53d5))
- **tests:** added a github action script testing for main([74e0c15](https://github.com/lastmile-ai/aiconfig/pull/368/commits/74e0c154defaf81e43e9e6070eae11668d3d75cf))
- **python-sdk:** Added linter to python-sdk

### Documentation

- **readme:** add readme and license within the python extension directory([450012c](https://github.com/lastmile-ai/aiconfig/pull/385/commits/450012c60089f6695a958aeabc359e27a5b9be55))
- **cookbooks** Updated Cookbooks' compatibility with latest aiconfig releases

### Extensions

- **python-extension:** Extension for HuggingFace Text Generation with transformers ([222bf6e](https://github.com/lastmile-ai/aiconfig/pull/348/commits/222bf6edf5c615b3b9b5f58b7fd5c829b2884d1b))
- **python-extension:** Extension for LLama 2.0
- **typescript-extension:** Extension for LLama 2.0
