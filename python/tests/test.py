from aiconfig import AIConfigRuntime
from aiconfig import Prompt
from aiconfig.AIConfigSettings import ModelMetadata, PromptMetadata
from aiconfig.default_parsers.hf import HuggingFaceTextParser
from aiconfig.model_parser import InferenceOptions
import asyncio

config = AIConfigRuntime.from_config("aiconfigs/basic_chatgpt_query_config.json")

HF_parser = HuggingFaceTextParser("mistralai/Mistral-7B-Instruct-v0.1")
config.register_model_parser(HF_parser)


def print_stream(data, accumulated_data, index: int):
    """
    Default streamCallback function that prints the output to the console.
    """
    print(data, end="", flush=True)


inference_options = InferenceOptions(stream_callback=print_stream)
asyncio.run(config.run("prompt2", {}, inference_options))
