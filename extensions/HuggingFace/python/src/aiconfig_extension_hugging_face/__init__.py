from .local_inference.text_2_image import HuggingFaceText2ImageDiffusor
from .local_inference.text_generation import HuggingFaceTextGenerationTransformer
from .local_inference.text_summarization import HuggingFaceTextSummarizationTransformer
from .local_inference.text_translation import HuggingFaceTextTranslationTransformer

# from .remote_inference_client.text_generation import HuggingFaceTextGenerationClient

LOCAL_INFERENCE_CLASSES = [
    "HuggingFaceText2ImageDiffusor",
    "HuggingFaceTextGenerationTransformer",
    "HuggingFaceTextSummarizationTransformer",
    "HuggingFaceTextTranslationTransformer",
]
REMOTE_INFERENCE_CLASSES = ["HuggingFaceTextGenerationClient"]
__ALL__ = LOCAL_INFERENCE_CLASSES + REMOTE_INFERENCE_CLASSES
