"""
Integrating AIConfig with HuggingFace.

This demo integrates AIConfig with HuggingFace. It shows how to use the HuggingFace model parser to run the `mistralai/Mistral-7B-Instruct-v0.1` model in AIConfig.
"""
import asyncio

# AIConfig Imports
from aiconfig import ModelParserRegistry
from aiconfig import AIConfigRuntime
from aiconfig.model_parser import InferenceOptions

# Import the HuggingFace model parser
from hf import HuggingFaceTextParser

# Register ModelParser
model_parser = HuggingFaceTextParser()
ModelParserRegistry.register_model_parser(model_parser)

# AIConfig under ."Mistral-aiconfig.json"
# {
#     "name": "exploring nyc through chatgpt config",
#     "description": "",
#     "schema_version": "latest",
#     "metadata": {
#         "parameters": {},
#         "models": {
#             "mistralai/Mistral-7B-v0.1": {
#                 "model": "mistralai/Mistral-7B-v0.1",
#                 "top_p": 0.9,
#                 "temperature": 0.9,
#                 "stream": true
#             }
#         },
#         "default_model": "mistralai/Mistral-7B-v0.1",
#         "model_parsers": {
#             "mistralai/Mistral-7B-v0.1": "HuggingFaceTextParser"
#         }
#     },
#     "prompts": [
#         {
#             "name": "prompt1",
#             "input": "What is your favorite condiment?"
#         }
#     ]
# }


async def main():
    config_file_path = "Mistral-aiconfig.json"
    config_runtime = AIConfigRuntime.from_config(config_file_path)

    # Define Streaming Callback Handler
    def stream_to_stdout(data, accumulated, index):
        print(data, end="")
    inference_options = InferenceOptions(stream_callback=stream_to_stdout)

    # Run the AIConfig
    parameters = {}
    await config_runtime.run("prompt1", parameters, inference_options)


if __name__ == "__main__":
    asyncio.run(main())
