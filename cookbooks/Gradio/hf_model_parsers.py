from aiconfig import AIConfigRuntime
from aiconfig_extension_hugging_face import (
    # HuggingFaceTextSummarizationTransformer,
    HuggingFaceText2ImageDiffusor,
    # HuggingFaceText2SpeechTransformer,
    HuggingFaceTextGenerationTransformer,
    # HuggingFaceTextTranslationTransformer,
)


def register_model_parsers() -> None:
    # NOTE: Commented out models need a new version of the aiconfig_extension_hugging_face package

    # AIConfigRuntime.register_model_parser(HuggingFaceTextSummarizationTransformer(), "TextSummarization")
    AIConfigRuntime.register_model_parser(HuggingFaceText2ImageDiffusor(), "Text2Image")
    # AIConfigRuntime.register_model_parser(HuggingFaceText2SpeechTransformer(), "Text2Speech")
    AIConfigRuntime.register_model_parser(HuggingFaceTextGenerationTransformer(), "TextGeneration")
    # AIConfigRuntime.register_model_parser(HuggingFaceTextTranslationTransformer(), "Translation")
