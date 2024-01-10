from aiconfig_extension_hugging_face import HuggingFaceAutomaticSpeechRecognitionTransformer
from aiconfig import ModelParserRegistry


def register_model_parsers():
    parser = HuggingFaceAutomaticSpeechRecognitionTransformer()
    ModelParserRegistry.register_model_parser(parser)
