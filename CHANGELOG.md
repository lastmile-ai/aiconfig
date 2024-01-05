# Changelog

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
- Converted protobuf to dict to fix pydantic BaseModel errors on Gemini (#558)([#558](https://github.com/lastmile-ai/aiconfig/pull/558))
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
