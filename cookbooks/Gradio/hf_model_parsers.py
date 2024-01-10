from aiconfig_extension_hugging_face import (
    HuggingFaceAutomaticSpeechRecognitionTransformer, # Haven't tested yet

    HuggingFaceImage2TextTransformer, # Tested, model doesn't support streaming
    HuggingFaceTextSummarizationTransformer, # Tested
    HuggingFaceText2ImageDiffusor, # Tested, model doesn't support streaming
    HuggingFaceText2SpeechTransformer, # Tested, model doesn't support streaming
    HuggingFaceTextGenerationTransformer, # Tested
    HuggingFaceTextTranslationTransformer, # Tested
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
    # ModelParserRegistry.register_model_parser(HuggingFaceText2SpeechTransformer())
    # ModelParserRegistry.register_model_parser(HuggingFaceTextGenerationTransformer())
    ModelParserRegistry.register_model_parser(HuggingFaceImage2TextTransformer())
    
    # ModelParserRegistry.register_model_parser(HuggingFaceAutomaticSpeechRecognitionTransformer())
    # ModelParserRegistry.register_model_parser(HuggingFaceTextSummarizationTransformer())
    # ModelParserRegistry.register_model_parser(HuggingFaceText2ImageDiffusor())
    # ModelParserRegistry.register_model_parser(HuggingFaceTextTranslationTransformer())
    # AIConfigRuntime.register_model_parser(HuggingFaceTextTranslationTransformer(), "TextTranslation")
