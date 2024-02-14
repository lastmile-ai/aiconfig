from aiconfig import AIConfigRuntime, ModelParserRegistry
from aiconfig_extension_hugging_face import (
    HuggingFaceAutomaticSpeechRecognitionTransformer,
    HuggingFaceImage2TextTransformer,
    HuggingFaceText2ImageDiffusor,
    HuggingFaceText2SpeechTransformer,
    HuggingFaceTextGenerationTransformer,
    HuggingFaceTextSummarizationTransformer,
    HuggingFaceTextTranslationTransformer,
)


# Example of how users can register model parsers for use in the GradioWorkbook
# The implementation looks for a parsers_path (model_parsers.py by default) which
# should include a module with a register_model_parsers function.
# Here we are registering all the local HuggingFace model parsers as an example
def register_model_parsers() -> None:
    """Register model parsers for local HuggingFace models."""
    automatic_speech_recognition = HuggingFaceAutomaticSpeechRecognitionTransformer()
    AIConfigRuntime.register_model_parser(
        automatic_speech_recognition, "Automatic Speech Recognition (Local)"
    )

    image_to_text = HuggingFaceImage2TextTransformer()
    AIConfigRuntime.register_model_parser(image_to_text, "Image-to-Text (Local)")

    text_to_image = HuggingFaceText2ImageDiffusor()
    AIConfigRuntime.register_model_parser(text_to_image, "Text-to-Image (Local)")

    text_to_speech = HuggingFaceText2SpeechTransformer()
    AIConfigRuntime.register_model_parser(text_to_speech, "Text-to-Speech (Local)")

    text_generation = HuggingFaceTextGenerationTransformer()
    AIConfigRuntime.register_model_parser(text_generation, "Text Generation (Local)")

    text_summarization = HuggingFaceTextSummarizationTransformer()
    AIConfigRuntime.register_model_parser(text_summarization, "Summarization (Local)")

    text_translation = HuggingFaceTextTranslationTransformer()
    AIConfigRuntime.register_model_parser(text_translation, "Translation (Local)")

    # By default, model parsers will also have their own ids registered. Remove those
    # since we just want the task-based names registered
    parsers = [
        automatic_speech_recognition,
        image_to_text,
        text_to_image,
        text_to_speech,
        text_generation,
        text_summarization,
        text_translation,
    ]

    for parser in parsers:
        ModelParserRegistry.remove_model_parser(parser.id())
