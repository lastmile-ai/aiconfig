import asyncio
import base64
import io
import numpy as np
from aiconfig_extension_hugging_face.local_inference.text_2_speech import HuggingFaceText2SpeechTransformer
from scipy.io.wavfile import write as write_wav

from aiconfig import AIConfigRuntime, InferenceOptions, CallbackManager


def print_stream(data, _accumulated_data, _index):
    print(data, end="", flush=True)


from transformers import pipeline


def test():
    synthesizer = pipeline("text-to-speech", "suno/bark")

    out = synthesizer("Look I am generating speech in three lines of code!")
    waveform, sampling_rate = [out["audio"], out["sampling_rate"]]
    print("waveform=", waveform.dtype, waveform.shape, waveform[:10], waveform.min(), waveform.max())
    # print("type=", type(out))
    # print("keys=", out.keys())
    # print("audio=", type(out["audio"]))

    scaled = np.int16(waveform / np.max(np.abs(waveform)) * np.iinfo(np.int16).max)
    print("scaled=", scaled.dtype, scaled.shape, scaled[:10], scaled.min(), scaled.max())

    buffered = io.BytesIO()
    b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    print("b64=", b64[:20])


async def main():
    return test()


async def run():
    # Load the aiconfig.

    mp = HuggingFaceText2SpeechTransformer()

    AIConfigRuntime.register_model_parser(mp, "translation_en_to_fr")

    config = AIConfigRuntime.load("/Users/jonathan/Projects/aiconfig/test_hf_transl.aiconfig.json")
    config.callback_manager = CallbackManager([])

    # print("Stream")
    # options = InferenceOptions(stream=True, stream_callback=print_stream)
    # out = await config.run("test_hf_trans", options=options)
    # print("Output:\n", out)

    print("no stream")
    options = InferenceOptions(stream=False)
    out = await config.run("test_hf_trans", options=options)
    print("Output:\n", out)


asyncio.run(main())
