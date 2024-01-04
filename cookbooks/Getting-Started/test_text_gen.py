import asyncio
from aiconfig_extension_hugging_face.local_inference.text_summarization import HuggingFaceTextSummarizationTransformer

from aiconfig import AIConfigRuntime, InferenceOptions, CallbackManager

# Load the aiconfig.

mp = HuggingFaceTextSummarizationTransformer()

AIConfigRuntime.register_model_parser(mp, "stevhliu/my_awesome_billsum_model")

config = AIConfigRuntime.load("/Users/jonathan/Projects/aiconfig/cookbooks/Getting-Started/travel.aiconfig.json")
config.callback_manager = CallbackManager([])


def print_stream(data, _accumulated_data, _index):
    print(data, end="", flush=True)


async def run():
    print("Stream")
    options = InferenceOptions(stream=True, stream_callback=print_stream)
    out = await config.run("test_hf_sum", options=options)
    print("Output:\n", out)

    print("no stream")
    options = InferenceOptions(stream=False)
    out = await config.run("test_hf_sum", options=options)
    print("Output:\n", out)


asyncio.run(run())
