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

    # AIConfigRuntime.register_model_parser(HuggingFaceTextSummarizationTransformer(), "TextSummarizationTask")
    AIConfigRuntime.register_model_parser(HuggingFaceText2ImageDiffusor(), "Text2ImageTask")
    # AIConfigRuntime.register_model_parser(HuggingFaceText2SpeechTransformer(), "Text2SpeechTask")
    AIConfigRuntime.register_model_parser(HuggingFaceTextGenerationTransformer(), "TextGenerationTask")
    # AIConfigRuntime.register_model_parser(HuggingFaceTextTranslationTransformer(), "TranslationTask")
