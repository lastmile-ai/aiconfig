# Local Model Inference
from aiconfig_extension_hugging_face import (
    HuggingFaceAutomaticSpeechRecognitionTransformer,
    HuggingFaceImage2TextTransformer,
    HuggingFaceText2ImageDiffusor,
    HuggingFaceText2SpeechTransformer,
    HuggingFaceTextGenerationTransformer,
    HuggingFaceTextSummarizationTransformer,
    HuggingFaceTextTranslationTransformer,
)

# Remote Inference
from aiconfig_extension_hugging_face import (
    HuggingFaceAutomaticSpeechRecognitionRemoteInference,
    HuggingFaceImage2TextRemoteInference,
    HuggingFaceText2ImageRemoteInference,
    HuggingFaceText2SpeechRemoteInference,
    HuggingFaceTextGenerationRemoteInference,
    HuggingFaceTextSummarizationRemoteInference,
    HuggingFaceTextTranslationRemoteInference,
)

from aiconfig import AIConfigRuntime


def register_model_parsers() -> None:
    """Register model parsers for HuggingFace models."""
    automatic_speech_recognition = (
        HuggingFaceAutomaticSpeechRecognitionTransformer()
    )
    AIConfigRuntime.register_model_parser(
        automatic_speech_recognition, automatic_speech_recognition.id()
    )

    image_to_text = HuggingFaceImage2TextTransformer()
    AIConfigRuntime.register_model_parser(image_to_text, image_to_text.id())

    text_to_image = HuggingFaceText2ImageDiffusor()
    AIConfigRuntime.register_model_parser(text_to_image, text_to_image.id())

    text_to_speech = HuggingFaceText2SpeechTransformer()
    AIConfigRuntime.register_model_parser(text_to_speech, text_to_speech.id())

    text_generation = HuggingFaceTextGenerationTransformer()
    AIConfigRuntime.register_model_parser(
        text_generation, text_generation.id()
    )
    text_summarization = HuggingFaceTextSummarizationTransformer()
    AIConfigRuntime.register_model_parser(
        text_summarization, text_summarization.id()
    )
    text_translation = HuggingFaceTextTranslationTransformer()
    AIConfigRuntime.register_model_parser(
        text_translation, text_translation.id()
    )

    # Register remote inference client for text generation
    automatic_speech_recognition_remote = (
        HuggingFaceAutomaticSpeechRecognitionRemoteInference()
    )
    AIConfigRuntime.register_model_parser(
        automatic_speech_recognition_remote, "Automatic Speech Recognition"
    )

    image_to_text_remote = HuggingFaceImage2TextRemoteInference()
    AIConfigRuntime.register_model_parser(
        image_to_text_remote, "Image-to-Text"
    )

    text_to_image_remote = HuggingFaceText2ImageRemoteInference()
    AIConfigRuntime.register_model_parser(
        text_to_image_remote, "Text-to-Image"
    )

    text_to_speech_remote = HuggingFaceText2SpeechRemoteInference()
    AIConfigRuntime.register_model_parser(
        text_to_speech_remote, "Text-to-Speech"
    )

    text_generation_remote = HuggingFaceTextGenerationRemoteInference()
    AIConfigRuntime.register_model_parser(
        text_generation_remote, "Text Generation"
    )

    text_summarization_remote = HuggingFaceTextSummarizationRemoteInference()
    AIConfigRuntime.register_model_parser(
        text_summarization_remote, "Summarization"
    )

    text_translation_remote = HuggingFaceTextTranslationRemoteInference()
    AIConfigRuntime.register_model_parser(
        text_translation_remote, "Translation"
    )
