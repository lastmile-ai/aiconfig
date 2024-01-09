# import ModelParserRegistry from aiconfig
import asyncio
import base64
import sys
from aiconfig.registry import ModelParserRegistry
from aiconfig_extension_hugging_face.local_inference.text_2_speech import HuggingFaceText2SpeechTransformer
from aiconfig_extension_hugging_face.local_inference.text_generation import HuggingFaceTextGenerationTransformer
from aiconfig_extension_hugging_face.local_inference.text_summarization import HuggingFaceTextSummarizationTransformer
from aiconfig_extension_hugging_face.local_inference.text_translation import HuggingFaceTextTranslationTransformer
from aiconfig import AIConfigRuntime, InferenceOptions, CallbackManager


async def run(hf_aiconfig_path: str):
    for model_parser in [
        HuggingFaceText2SpeechTransformer(),
        HuggingFaceTextGenerationTransformer(),
    ]:
        ModelParserRegistry.register_model_parser(model_parser)

    AIConfigRuntime.register_model_parser(HuggingFaceTextTranslationTransformer(), "translation_en_to_fr")
    AIConfigRuntime.register_model_parser(HuggingFaceTextSummarizationTransformer(), "stevhliu/my_awesome_billsum_model")
    ModelParserRegistry.register_model_parser(HuggingFaceText2SpeechTransformer())
    # AIConfigRuntime.register_model_parser(mp, "text_2_speech")
    # AIConfigRuntime.register_model_parser(mp, "suno/bark")

    config = AIConfigRuntime.load(hf_aiconfig_path)
    config.callback_manager = CallbackManager([])

    options = InferenceOptions(stream=False)

    # out1 = await config.run(
    #     #
    #     "translate_instruction",
    #     options=options,
    # )
    # print(f"{out1=}")

    # out2 = await config.run(
    #     #
    #     "generate_story",
    #     options=options,
    # )
    # print(f"{out2=}")

    # out3 = await config.run(
    #     #
    #     "summarize_story",
    #     options=options,
    # )

    # print(f"{out3=}")

    out4 = await config.run(
        #
        "generate_audio_title",
        options=options,
    )

    print(f"{out4=}")
    with open("story_title.wav", "wb") as f:
        encoded = out4[0].data.value
        decoded_binary = base64.b64decode(encoded.encode("utf-8"))
        f.write(decoded_binary)

    # print("Stream")
    # options = InferenceOptions(stream=True, stream_callback=print_stream)
    # out = await config.run("test_hf_trans", options=options)
    # print("Output:\n", out)


async def main(argv: list[str]):
    print("Starting!")
    path = argv[1]
    print(f"Loading aiconfig from {path}")
    await run(path)
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main(sys.argv))
