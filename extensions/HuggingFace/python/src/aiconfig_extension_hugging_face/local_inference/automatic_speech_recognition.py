from typing import Any, Dict, Optional, List, TYPE_CHECKING
from aiconfig import ParameterizedModelParser, InferenceOptions
from aiconfig.callback import CallbackEvent
import torch
from aiconfig.schema import Prompt, Output, ExecuteResult, Attachment

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
    ) -> List[Prompt]:
        """
        Defines how a prompt and model inference settings get serialized in the .aiconfig.
        Assume input in the form of input(s) being passed into an already constructed pipeline.

        Args:
            prompt (str): The prompt to be serialized.
            data (Any): Model-specific inference settings to be serialized.
            ai_config (AIConfigRuntime): The AIConfig Runtime.
            parameters (Dict[str, Any], optional): Model-specific parameters. Defaults to None.

        Returns:
            str: Serialized representation of the prompt and inference settings.
        """
        await ai_config.callback_manager.run_callbacks(
            CallbackEvent(
                "on_serialize_start",
                __name__,
                {
                    "prompt_name": prompt_name,
                    "data": data,
                    "parameters": parameters,
                },
            )
        )

        prompts = []

        if not isinstance(data, dict):
            raise ValueError("Invalid data type. Expected dict when serializing prompt data to aiconfig.")
        if data.get("inputs", None) is None:
            raise ValueError("Invalid data when serializing prompt to aiconfig. Input data must contain an inputs field.")

        prompt = Prompt(
            **{
                "name": prompt_name,
                "input": {"attachments": [{"data": data["inputs"]}]},
                "metadata": None,
                "outputs": None,
            }
        )

        prompts.append(prompt)

        await ai_config.callback_manager.run_callbacks(CallbackEvent("on_serialize_complete", __name__, {"result": prompts}))
        return prompts

    async def deserialize(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        params: Optional[Dict[str, Any]] = {},
    ) -> Dict[str, Any]:
        await aiconfig.callback_manager.run_callbacks(CallbackEvent("on_deserialize_start", __name__, {"prompt": prompt, "params": params}))

        # Build Completion data
        completion_params = self.get_model_settings(prompt, aiconfig)

        # ASR Pipeline supports input types of bytes, file path, and a dict containing raw sampled audio. Also supports multiple input
        # For now, support multiple or single uri's as input
        # TODO: Support or figure out if other input types are needed (base64, bytes), as well as the sampled audio dict
        # See api docs for more info:
        # - https://github.com/huggingface/transformers/blob/v4.36.1/src/transformers/pipelines/automatic_speech_recognition.py#L313-L317
        # - https://huggingface.co/docs/transformers/main_classes/pipelines#transformers.AutomaticSpeechRecognitionPipeline
        inputs = validate_and_retrieve_audio_from_attachments(prompt)

        completion_params["inputs"] = inputs

        await aiconfig.callback_manager.run_callbacks(CallbackEvent("on_deserialize_complete", __name__, {"output": completion_params}))
        return completion_params

    async def run_inference(self, prompt: Prompt, aiconfig: "AIConfigRuntime", options: InferenceOptions, parameters: Dict[str, Any]) -> list[Output]:
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_run_start",
                __name__,
                {"prompt": prompt, "options": options, "parameters": parameters},
            )
        )
        model_name = aiconfig.get_model_name(prompt)

        if isinstance(model_name, str) and model_name not in self.pipelines:
            device = self._get_device()
            # Build a pipeline for the model. TODO: support other pipeline creation options. ie pipeline config, torch dtype, etc
            self.pipelines[model_name] = pipeline(task="automatic-speech-recognition", model=model_name, device=device)

        asr_pipeline = self.pipelines[model_name]
        completion_data = await self.deserialize(prompt, aiconfig, parameters)

        response = asr_pipeline(**completion_data)

        output = ExecuteResult(output_type="execute_result", data=response, metadata={})

        prompt.outputs = [output]
        await aiconfig.callback_manager.run_callbacks(CallbackEvent("on_run_complete", __name__, {"result": prompt.outputs}))
        return prompt.outputs

    def _get_device(self) -> str:
        if torch.cuda.is_available():
            return "cuda"
        # Mps backend is not supported for all asr models. Seen when spinning up a default asr pipeline which uses facebook/wav2vec2-base-960h 55bb623
        return "cpu"

    def get_output_text(self, response: dict[str, Any]) -> str:
        raise NotImplementedError("get_output_text is not implemented for HuggingFaceAutomaticSpeechRecognition")


def validate_attachment_type_is_audio(attachment: Attachment):
    if not hasattr(attachment, "mime_type"):
        raise ValueError(f"Attachment has no mime type. Specify the audio mimetype in the aiconfig")

    if not attachment.mime_type.startswith("audio/"):
        raise ValueError(f"Invalid attachment mimetype {attachment.mime_type}. Expected audio mimetype.")


def validate_and_retrieve_audio_from_attachments(prompt: Prompt) -> list[str]:
    """
    Retrieves the audio uri's from each attachment in the prompt input.

    Throws an exception if
    - attachment is not audio
    - attachment data is not a uri
    - no attachments are found
    - operation fails for any reason
    """

    if not hasattr(prompt.input, "attachments") or len(prompt.input.attachments) == 0:
        raise ValueError(f"No attachments found in input for prompt {prompt.name}. Please add an audio attachment to the prompt input.")

    audio_uris: list[str] = []

    for i, attachment in enumerate(prompt.input.attachments):
        validate_attachment_type_is_audio(attachment)

        if not isinstance(attachment.data, str):
            # See todo above, but for now only support uri's
            raise ValueError(f"Attachment #{i} data is not a uri. Please specify a uri for the audio attachment in prompt {prompt.name}.")

        audio_uris.append(attachment.data)

    return audio_uris
