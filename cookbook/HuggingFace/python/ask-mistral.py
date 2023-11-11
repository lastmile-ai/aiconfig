from aiconfig import AIConfigRuntime
from aiconfig.model_parser import InferenceOptions
import asyncio
from hf import HuggingFaceTextParser


async def main():
    text_generation_model_parser = HuggingFaceTextParser(use_api_token=False)
    AIConfigRuntime.register_model_parser(text_generation_model_parser, "HuggingFaceTextParser")

    config = AIConfigRuntime.load("Mistral-aiconfig.json")

    def stream_callback(data, accumulated_message, index):
        print(data, end="")

    inference_options = InferenceOptions(stream_callback=stream_callback)
    await config.run("prompt1", options=inference_options)


if __name__ == "__main__":
    asyncio.run(main())
