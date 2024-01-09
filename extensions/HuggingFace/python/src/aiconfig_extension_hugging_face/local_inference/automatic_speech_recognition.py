from typing import Any, Coroutine, Dict, Optional, List, TYPE_CHECKING
from aiconfig import ParameterizedModelParser, InferenceOptions, AIConfig

from aiconfig.schema import Prompt, Output
from transformers import Pipeline

if TYPE_CHECKING:
    from aiconfig import AIConfigRuntime
"""
Model Parser for HuggingFace ASR (Automatic Speech Recognition) models.
"""


class HuggingFaceAutomaticSpeechRecognition(ParameterizedModelParser):
    def __init__(self):
        """
        Returns:
            HuggingFaceAutomaticSpeechRecognition

        Usage:
        1. Create a new model parser object with the model ID of the model to use.
                parser = HuggingFaceAutomaticSpeechRecognition()
        2. Add the model parser to the registry.
                config.register_model_parser(parser)
        """
        super().__init__()
        self.generators: dict[str, Pipeline] = {}

    def id(self) -> str:
        """
        Returns an identifier for the Model Parser
        """
        return "HuggingFaceAutomaticSpeechRecognition"

    async def serialize(
        self,
        prompt_name: str,
        data: Any,
        ai_config: "AIConfigRuntime",
        parameters: Optional[Dict[str, Any]] = None,
        **completion_params,
    ) -> List[Prompt]:
        """
        Defines how a prompt and model inference settings get serialized in the .aiconfig.

        Args:
            prompt (str): The prompt to be serialized.
            data (Any): Model-specific inference settings to be serialized.
            ai_config (AIConfigRuntime): The AIConfig Runtime.
            parameters (Dict[str, Any], optional): Model-specific parameters. Defaults to None.

        Returns:
            str: Serialized representation of the prompt and inference settings.
        """

    async def deserialize(
        self,
        prompt: Prompt,
        aiconfig: "AIConfig",
        params: Optional[Dict[str, Any]] = {},
    ) -> Dict[str, Any]:
        pass

    async def run_inference(self, prompt: Prompt, aiconfig: "AIConfigRuntime", options: InferenceOptions, parameters: Dict[str, Any]) -> list[Output]:
        pass
