from typing import Any, Dict, Optional, List, TYPE_CHECKING
from aiconfig import ParameterizedModelParser, InferenceOptions, AIConfig
import torch
from aiconfig.schema import Prompt, Output, ExecuteResult
from transformers import pipeline, Pipeline

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
        self.pipelines: dict[str, Pipeline] = {}

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
        aiconfig: "AIConfigRuntime",
        params: Optional[Dict[str, Any]] = {},
    ) -> Dict[str, Any]:
        # Build Completion data
        completion_params = self.get_model_settings(prompt, aiconfig)

        inputs = prompt.input.attachments[0].data

        completion_params["inputs"] = inputs
        return completion_params

    async def run_inference(self, prompt: Prompt, aiconfig: "AIConfigRuntime", options: InferenceOptions, parameters: Dict[str, Any]) -> list[Output]:
        model_name = aiconfig.get_model_name(prompt)

        if isinstance(model_name, str) and model_name not in self.pipelines:
            device = self._get_device()
            self.pipelines[model_name] = pipeline(task="automatic-speech-recognition", model=model_name, device=device)

        asr_pipeline = self.pipelines[model_name]
        completion_data = await self.deserialize(prompt, aiconfig, parameters)

        response = asr_pipeline(**completion_data)

        output = ExecuteResult(output_type="execute_result", data=response, metadata={})

        prompt.outputs = [output]

        return prompt.outputs

    def _get_device(self) -> str:
        if torch.cuda.is_available():
            return "cuda"
        # Mps backend is not supported for all asr models.
        # This is currently a torch library limitation. Test this by creating a pipeline with mps backend.
        return "cpu"

    def get_output_text(self, response: dict[str, Any]) -> str:
        return
