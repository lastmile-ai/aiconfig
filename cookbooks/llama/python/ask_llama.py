import asyncio
import sys

from aiconfig.model_parser import InferenceOptions
from llama import LlamaModelParser

from aiconfig import AIConfigRuntime
import argparse


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--aiconfig-path",
        type=str,
        required=True,
        help="Relative or absolute path to aiconfig json, e.g. cookbooks/llama/llama-aiconfig.json",
    )
    parser.add_argument(
        "--model-path",
        type=str,
        required=True,
        help="Relative or absolute path to model",
    )
    args = parser.parse_args()
    return await run(args.aiconfig_path, args.model_path)


async def run(aiconfig_path: str, model_path: str):
    llama_model_parser = LlamaModelParser(model_path=model_path)

    for lm in [
        "llama-2-7b-chat",
        "llama-2-13b-chat",
        "codeup-llama-2-13b-chat-hf",
    ]:
        AIConfigRuntime.register_model_parser(llama_model_parser, lm)

    config = AIConfigRuntime.load(aiconfig_path)

    def stream_callback(data, accumulated_message, index):
        print(data, end="", flush=True)

    inference_options = InferenceOptions(
        stream=True,
        stream_callback=stream_callback,
    )

    print("\n\nRunning prompt7b...")

    await config.run("prompt7b", params={}, options=inference_options)
    print("\n\nRunning prompt7b_chat...")
    await config.run("prompt7b_chat", params={}, options=inference_options)

    print("\n\nRunning prompt13b...")
    await config.run("prompt13b", params={}, options=inference_options)

    print("\n\nRunning prompt13b_code...")
    await config.run("prompt13b_code", params={}, options=inference_options)


if __name__ == "__main__":
    res = asyncio.run(main())
    sys.exit(res)
