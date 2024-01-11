# Changelog

## (2024-01-11) Python Version 1.1.10, NPM Version 1.1.5

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
