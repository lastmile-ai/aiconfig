from aiconfig_extension_hugging_face import (
    HuggingFaceAutomaticSpeechRecognitionTransformer,
    HuggingFaceImage2TextTransformer,
    HuggingFaceTextSummarizationTransformer,
    HuggingFaceText2ImageDiffusor,
    HuggingFaceText2SpeechTransformer,
    HuggingFaceTextGenerationTransformer,
    HuggingFaceTextTranslationTransformer,
)
from aiconfig import (AIConfigRuntime, ModelParserRegistry)

def register_model_parsers() -> None:
    """Register model parsers for HuggingFace models.
    """
    # Audio --> Text
    # AIConfigRuntime.register_model_parser(HuggingFaceAutomaticSpeechRecognitionTransformer(), "AutomaticSpeechRecognition")

    # # Image --> Text
    # AIConfigRuntime.register_model_parser(HuggingFaceImage2TextTransformer(), "Image2Text")

    # # Text --> Image
    # AIConfigRuntime.register_model_parser(HuggingFaceText2ImageDiffusor(), "Text2Image")

    # # Text --> Audio
    # AIConfigRuntime.register_model_parser(HuggingFaceText2SpeechTransformer(), "Text2Speech")

    # # Text --> Text
    # AIConfigRuntime.register_model_parser(HuggingFaceTextGenerationTransformer(), "TextGeneration")
    # AIConfigRuntime.register_model_parser(HuggingFaceTextSummarizationTransformer(), "TextSummarization")
    ModelParserRegistry.register_model_parser(HuggingFaceTextSummarizationTransformer())
    # AIConfigRuntime.register_model_parser(HuggingFaceTextTranslationTransformer(), "TextTranslation")
