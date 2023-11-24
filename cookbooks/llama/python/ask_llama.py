import asyncio

from aiconfig.model_parser import InferenceOptions
from llama import LlamaModelParser

from aiconfig import AIConfigRuntime


async def main():
    # Step 1. We assume you have a local model file.
    # Step 2. We assume you have prepared an AIConfig.
    aiconfig_path = "cookbooks/llama/llama-aiconfig.json"

    # Step 3. Instantiate a model parser with your local model file.
    llama_model_parser = LlamaModelParser(
        model_path="models/llama-2-7b-chat.Q4_K_M.gguf"
    )

    # 4. Register the model parser with the model name (see file path).
    AIConfigRuntime.register_model_parser(llama_model_parser, "llama-2-7b-chat")

    # 5. Use the AIConfigRuntime API to load and run your prompt(s).
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
    code_res = await config.run("prompt13b_code", params={}, options=inference_options)
    print(f"\n\n\n\nCode response:\n{code_res}")


if __name__ == "__main__":
    asyncio.run(main())
