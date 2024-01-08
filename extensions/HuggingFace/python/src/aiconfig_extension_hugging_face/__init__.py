from .local_inference.text_2_image import HuggingFaceText2ImageDiffusor
from .local_inference.text_generation import HuggingFaceTextGenerationTransformer
from .remote_inference_client.text_generation import HuggingFaceTextGenerationParser
from .local_inference.text_summarization import HuggingFaceTextSummarizationTransformer
from .local_inference.text_translation import HuggingFaceTextTranslationTransformer
from .local_inference.text_2_speech import HuggingFaceText2SpeechTransformer


# from .remote_inference_client.text_generation import HuggingFaceTextGenerationClient

LOCAL_INFERENCE_CLASSES = [
    "HuggingFaceText2ImageDiffusor",
    "HuggingFaceTextGenerationTransformer",
    "HuggingFaceTextSummarizationTransformer",
    "HuggingFaceTextTranslationTransformer",
    "HuggingFaceText2SpeechTransformer",
]
REMOTE_INFERENCE_CLASSES = ["HuggingFaceTextGenerationParser"]
__ALL__ = LOCAL_INFERENCE_CLASSES + REMOTE_INFERENCE_CLASSES
