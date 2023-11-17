import asyncio
from aiconfig_extension_huggingface_textgeneration import hf

from aiconfig import AIConfigRuntime, InferenceOptions

async def main():

    model_parser = hf.HuggingFaceTextParser()
    AIConfigRuntime.register_model_parser(model_parser, 'HuggingFaceTextGenerationModelParser')
    
    config = AIConfigRuntime.load("../Mistral-aiconfig.json")

    def stream_callback(data, accumulated_message, index):
        print(data, end="")

    inference_options = InferenceOptions(stream_callback=stream_callback)
    await config.run("prompt1", options=inference_options)


if __name__ == "__main__":
    asyncio.run(main())
