from aiconfig import AIConfigRuntime
from aiconfig.model_parser import InferenceOptions
import asyncio
from llama import LlamaModelParser, SUPPORTED_MODELS as LLAMA_MODELS


async def main():
    llama_model_parser = LlamaModelParser(
        model_path="models/llama-2-7b-chat.Q4_K_M.gguf"
    )

    for lm in LLAMA_MODELS:
        AIConfigRuntime.register_model_parser(llama_model_parser, lm)

    config = AIConfigRuntime.load("cookbooks/llama/llama-aiconfig.json")

    inference_options = InferenceOptions()

    response7b = await config.run("prompt7b", inference_options=inference_options)

    texts = config.get_output_text("prompt7b", response7b)
    print(f"Output:\n{texts[0]}")


if __name__ == "__main__":
    asyncio.run(main())
