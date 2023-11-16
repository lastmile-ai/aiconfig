import asyncio

from aiconfig.model_parser import InferenceOptions
from aiconfig.schema import Prompt, PromptMetadata
from llama import LlamaModelParser

from aiconfig import AIConfigRuntime


async def main():
    llama_model_parser = LlamaModelParser(
        model_path="models/llama-2-7b-chat.Q4_K_M.gguf"
    )

    for lm in [
        "llama-2-7b-chat",
        "llama-2-13b-chat",
        "codeup-llama-2-13b-chat-hf",
    ]:
        AIConfigRuntime.register_model_parser(llama_model_parser, lm)

    config = AIConfigRuntime.load("cookbooks/llama/llama-aiconfig.json")

    deser = await llama_model_parser.deserialize(
        Prompt(name="the_prompt", input="the_input"), config, {}
    )

    print(f"{deser=}")

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
    code_res = await config.run("prompt13b_code", params={}, options=inference_options)
    print(f"\n\n\n\nCode response:\n{code_res}")


if __name__ == "__main__":
    asyncio.run(main())
