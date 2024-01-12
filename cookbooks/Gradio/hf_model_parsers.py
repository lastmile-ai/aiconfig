from aiconfig_extension_hugging_face import (
    HuggingFaceAutomaticSpeechRecognitionTransformer,
    HuggingFaceImage2TextTransformer,
    HuggingFaceTextSummarizationTransformer,
    HuggingFaceText2ImageDiffusor,
    HuggingFaceText2SpeechTransformer,
    HuggingFaceTextGenerationTransformer,
    HuggingFaceTextTranslationTransformer,
)

from aiconfig_extension_hugging_face.remote_inference_client.text_generation import HuggingFaceTextGenerationParser

from aiconfig import AIConfigRuntime


def register_model_parsers() -> None:
    """Register model parsers for HuggingFace models."""
    automatic_speech_recognition = HuggingFaceAutomaticSpeechRecognitionTransformer()
    AIConfigRuntime.register_model_parser(automatic_speech_recognition, automatic_speech_recognition.id())

    image_to_text = HuggingFaceImage2TextTransformer()
    AIConfigRuntime.register_model_parser(image_to_text, image_to_text.id())

    text_to_image = HuggingFaceText2ImageDiffusor()
    AIConfigRuntime.register_model_parser(text_to_image, text_to_image.id())

    text_to_speech = HuggingFaceText2SpeechTransformer()
    AIConfigRuntime.register_model_parser(text_to_speech, text_to_speech.id())

    text_generation = HuggingFaceTextGenerationTransformer()
    AIConfigRuntime.register_model_parser(text_generation, text_generation.id())
    text_summarization = HuggingFaceTextSummarizationTransformer()
    AIConfigRuntime.register_model_parser(text_summarization, text_summarization.id())
    text_translation = HuggingFaceTextTranslationTransformer()
    AIConfigRuntime.register_model_parser(text_translation, text_translation.id())

    # Register remote inference client for text generation
    text_generation_remote = HuggingFaceTextGenerationParser()
    AIConfigRuntime.register_model_parser(text_generation_remote, text_generation_remote.id())
