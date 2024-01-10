from .local_inference.automatic_speech_recognition import HuggingFaceAutomaticSpeechRecognitionTransformer
from .local_inference.image_2_text import HuggingFaceImage2TextTransformer
from .local_inference.text_2_image import HuggingFaceText2ImageDiffusor
from .local_inference.text_2_speech import HuggingFaceText2SpeechTransformer
from .local_inference.text_generation import HuggingFaceTextGenerationTransformer
from .local_inference.text_summarization import HuggingFaceTextSummarizationTransformer
from .local_inference.text_translation import HuggingFaceTextTranslationTransformer
from .remote_inference_client.text_generation import HuggingFaceTextGenerationParser


LOCAL_INFERENCE_CLASSES = [
    "HuggingFaceAutomaticSpeechRecognitionTransformer",
    "HuggingFaceImage2TextTransformer",
    "HuggingFaceText2ImageDiffusor",
    "HuggingFaceText2SpeechTransformer",
    "HuggingFaceTextGenerationTransformer",
    "HuggingFaceTextSummarizationTransformer",
    "HuggingFaceTextTranslationTransformer",
]
REMOTE_INFERENCE_CLASSES = ["HuggingFaceTextGenerationParser"]
__ALL__ = LOCAL_INFERENCE_CLASSES + REMOTE_INFERENCE_CLASSES
