import copy
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from aiconfig.util.config_utils import get_api_key_from_environment

from aiconfig_extension_hugging_face.local_inference.util import get_hf_model
from aiconfig.callback import CallbackEvent

from aiconfig import InferenceOptions, ModelParser
from aiconfig.schema import (
    Attachment,
    AttachmentDataWithStringValue,
    ExecuteResult,
    Output,
    Prompt,
    PromptInput,
)

# HuggingFace API imports
from huggingface_hub import InferenceClient

if TYPE_CHECKING:
    from aiconfig import AIConfigRuntime


# Step 1: define Helpers
def refine_completion_params(model_settings: dict[Any, Any]) -> dict[str, Any]:
    """
    Refines the completion params for the HF Automatic Speech Recognition api. Removes any unsupported params.
    See https://github.com/huggingface/huggingface_hub/blob/main/src/huggingface_hub/inference/_client.py#L302
    for supported params.

    Note: The inference endpoint does not support all the same params as transformers' pipelines()
    """

    supported_keys = {
        "model",
    }

    completion_data = {}
    for key in model_settings:
        if key.lower() in supported_keys:
            completion_data[key.lower()] = model_settings[key]

    return completion_data


def construct_output(response: str) -> Output:
    """
    Constructs an output from the response of the HF ASR pipeline.

    Response from pipeline could contain multiple outputs and time stamps. No Docs found for this.
    """
    output = ExecuteResult(
        output_type="execute_result",
        data=response,
        execution_count=0,
        metadata={},
    )
    return output


class HuggingFaceAutomaticSpeechRecognitionRemoteInference(ModelParser):
    """
    Model Parser for HuggingFace ASR (Automatic Speech Recognition) models.
    """

    def __init__(self, model_id: str = None, use_api_token: bool = False):
        """
        Returns:
            HuggingFaceAutomaticSpeechRecognitionRemoteInference

        Usage:
        1. Create a new model parser object with the model ID of the model to use.
                parser = HuggingFaceAutomaticSpeechRecognitionTransformer()
        2. Add the model parser to the registry.
                config.register_model_parser(parser)
        """
        super().__init__()

        token = None

        if use_api_token:
            # You are allowed to use Hugging Face for a bit before you get
            # rate limited, in which case you will receive a clear error
            token = get_api_key_from_environment(
                "HUGGING_FACE_API_TOKEN", required=False
            ).unwrap()

        self.client = InferenceClient(model_id, token=token)

    def id(self) -> str:
        """
        Returns an identifier for the Model Parser
        """
        return "HuggingFaceAutomaticSpeechRecognitionRemoteInference"

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
        # TODO: make a github task for this
        raise NotImplementedError(
            "serialize is not implemented for HuggingFaceAutomaticSpeechRecognitionRemoteInference"
        )

    async def deserialize(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        params: Optional[Dict[str, Any]] = {},
    ) -> Dict[str, Any]:
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_deserialize_start",
                __name__,
                {"prompt": prompt, "params": params},
            )
        )

        # Build Completion data
        model_settings = self.get_model_settings(prompt, aiconfig)

        completion_data = refine_completion_params(model_settings)

        # ASR Pipeline supports input types of bytes, file path, and a dict containing raw sampled audio. Also supports multiple input
        # For now, support multiple or single uri's as input
        # TODO: Support or figure out if other input types are needed (base64, bytes), as well as the sampled audio dict
        # See api docs for more info:
        # - https://github.com/huggingface/transformers/blob/v4.36.1/src/transformers/pipelines/automatic_speech_recognition.py#L313-L317
        # - https://huggingface.co/docs/transformers/main_classes/pipelines#transformers.AutomaticSpeechRecognitionPipeline
        inputs = validate_and_retrieve_audio_from_attachments(prompt)

        completion_data["inputs"] = inputs

        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_deserialize_complete",
                __name__,
                {"output": completion_data},
            )
        )
        return completion_data

    async def run(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        options: InferenceOptions,
        parameters: Dict[str, Any],
        **kwargs,
    ) -> list[Output]:
        """
        Invoked to run a prompt in the .aiconfig. This method should perform
        the actual model inference based on the provided prompt and inference settings.

        Args:
            prompt (str): The input prompt.
            inference_settings (dict): Model-specific inference settings.

        Returns:
            InferenceResponse: The response from the model.
        """
        sanitized_options = copy.deepcopy(options)
        run_override_api_token = getattr(sanitized_options, "api_token", None)
        # Redact api token from logs if it exists
        if run_override_api_token:
            setattr(sanitized_options, "api_token", "hf_********")
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_run_start",
                __name__,
                {
                    "prompt": prompt,
                    "options": options,
                    "parameters": parameters,
                },
            )
        )

        completion_data = await self.deserialize(prompt, aiconfig, parameters)

        response = self.client.automatic_speech_recognition(**completion_data)

        # HF Automatic Speech Recognition api doesn't support multiple outputs. Expect only one output.
        # Output spec: response is str
        outputs = [construct_output(response)]  
        prompt.outputs = outputs

        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_run_complete", __name__, {"result": prompt.outputs}
            )
        )
        return prompt.outputs

    def get_output_text(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        output: Optional[Output] = None,
    ) -> str:
        if output is None:
            output = aiconfig.get_latest_output(prompt)

        if output is None:
            return ""

        # TODO (rossdanlm): Handle multiple outputs in list
        # https://github.com/lastmile-ai/aiconfig/issues/467
        if output.output_type == "execute_result":
            output_data = output.data
            if isinstance(output_data, str):
                return output_data
        return ""


def validate_attachment_type_is_audio(attachment: Attachment):
    if not hasattr(attachment, "mime_type"):
        raise ValueError(
            f"Attachment has no mime type. Specify the audio mimetype in the aiconfig"
        )

    if not attachment.mime_type.startswith("audio/"):
        raise ValueError(
            f"Invalid attachment mimetype {attachment.mime_type}. Expected audio mimetype."
        )


def validate_and_retrieve_audio_from_attachments(prompt: Prompt) -> list[str]:
    """
    Retrieves the audio uri's or base64 from each attachment in the prompt input.

    Throws an exception if
    - attachment is not audio
    - attachment data is not a uri
    - no attachments are found
    - operation fails for any reason
    """

    if not isinstance(prompt.input, PromptInput):
        raise ValueError(
            f"Prompt input is of type {type(prompt.input) }. Please specify a PromptInput with attachments for prompt {prompt.name}."
        )

    if prompt.input.attachments is None or len(prompt.input.attachments) == 0:
        raise ValueError(
            f"No attachments found in input for prompt {prompt.name}. Please add an audio attachment to the prompt input."
        )

    audio_inputs: list[str] = []

    for i, attachment in enumerate(prompt.input.attachments):
        validate_attachment_type_is_audio(attachment)

        if not isinstance(attachment.data, AttachmentDataWithStringValue):
            raise ValueError(
                f"""Attachment data must be of type `AttachmentDataWithStringValue` with a `kind` and `value` field. 
                         Please specify a uri for the audio attachment in prompt {prompt.name}."""
            )

        audio_inputs.append(attachment.data.value)

    return audio_inputs
