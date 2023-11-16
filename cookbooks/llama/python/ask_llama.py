import asyncio

from aiconfig.model_parser import InferenceOptions
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

    print("Getting response without streaming...")
    response7b = await config.run("prompt7b", {})
    texts = config.get_output_text("prompt7b", response7b)
    print(f"\n\n\nFinal output:\n{texts[0]}")

    print("\n\n\n\nGetting streaming response...")

    def stream_callback(data, accumulated_message, index):
        print(data, end="", flush=True)

    inference_options = InferenceOptions(
        stream=True,
        stream_callback=stream_callback,
    )

    response7b = await config.run("prompt7b", {}, options=inference_options)

    texts = config.get_output_text("prompt7b", response7b)
    print(f"\n\n\nFinal output:\n{texts[0]}")


if __name__ == "__main__":
    asyncio.run(main())
