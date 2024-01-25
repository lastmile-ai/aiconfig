import base64
import copy
from io import BytesIO
import json
from pathlib import Path
from typing import TYPE_CHECKING, Any, BinaryIO, Dict, List, Optional, Union

# HuggingFace API imports
from huggingface_hub import InferenceClient

from aiconfig import CallbackEvent
from aiconfig.model_parser import InferenceOptions, ModelParser
from aiconfig.schema import (
    Attachment,
    AttachmentDataWithStringValue,
    ExecuteResult,
    Output,
    Prompt,
    PromptInput,
    PromptMetadata,
)
from aiconfig.util.config_utils import get_api_key_from_environment
from PIL import Image as img_module
from PIL.Image import Image as ImageType

# image is Union[bytes, BinaryIO, Path, str] where str could be path or uri
RequestImageType = Union[Path, str, bytes, BinaryIO]

# Circuluar Dependency Type Hints
if TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime


# Step 1: define Helpers
def refine_completion_params(model_settings: dict[Any, Any]) -> dict[str, Any]:
    """
    Refines the completion params for the HF image_to_text api. Removes any unsupported params.
    See https://github.com/huggingface/huggingface_hub/blob/main/src/huggingface_hub/inference/_client.py#L731
    for supported params.
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
    output = ExecuteResult(
        **{
            "output_type": "execute_result",
            "data": response,
            "execution_count": 0,
            "metadata": {},
        }
    )
    return output


class HuggingFaceImage2TextRemoteInference(ModelParser):
    """
    A model parser for HuggingFace image-to-text models.
    """

    def __init__(self, model_id: str = None, use_api_token=False):
        """
        Args:
            model_id (str): The model ID of the model to use.
            no_token (bool): Whether or not to require an API token. Set to False if you don't have an api key.

        Returns:
            HuggingFaceImage2TextRemoteInference: The HuggingFaceImage2TextRemoteInference object.

        Usage:

        1. Create a new model parser object with the model ID of the model to use.
                parser = HuggingFaceImage2TextRemoteInference("Salesforce/blip-image-captioning-base", use_api_token=False)
        2. Add the model parser to the registry.
                config.register_model_parser(parser)

        If use_api_token is set to True, then the model parser will require an API token to be set in the environment variable HUGGING_FACE_API_TOKEN.


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
        return "HuggingFaceImage2TextRemoteInference"

    async def serialize(
        self,
        prompt_name: str,
        data: Any,
        ai_config: "AIConfigRuntime",
        parameters: Optional[dict[Any, Any]] = None,
        **kwargs,
    ) -> list[Prompt]:
        """
        Defines how a prompt and model inference settings get serialized in the .aiconfig.

        Args:
            prompt (str): The prompt to be serialized.
            inference_settings (dict): Model-specific inference settings to be serialized.

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
                    "kwargs": kwargs,
                },
            )
        )

        # assume data is completion params for HF image_to_text
        data = copy.deepcopy(data)

        # For now, support Path as path to local image file or str as uri only
        # TODO: Support bytes and BinaryIO
        image: RequestImageType = data["image"]

        # In some cases (e.g. for uri), we can't determine the mimetype subtype
        # without loading it, so just use the discrete type by default
        mime_type = "image"

        if isinstance(image, Path):
            data["image"] = str(image.as_uri())
            # Assume the image is saved with extension matching mimetype
            file_extension = image.suffix.lower()[1:]
            mime_type = f"image/{file_extension}"
        elif isinstance(image, str):
            # Assume it's a uri
            pass
        else:
            raise ValueError(
                f"Invalid image type. Expected Path or str, got {type(image)}"
            )

        attachment_data = AttachmentDataWithStringValue(
            kind="file_uri", value=data["image"]
        )
        attachments: List[Attachment] = [
            Attachment(data=attachment_data, mime_type=mime_type)
        ]
        prompt_input = PromptInput(attachments=attachments)

        # image is handled, remove from data
        data.pop("image", None)

        prompts = []

        model_metadata = ai_config.get_model_metadata(data, self.id())
        prompt = Prompt(
            name=prompt_name,
            input=prompt_input,
            metadata=PromptMetadata(
                model=model_metadata, parameters=parameters, **kwargs
            ),
        )

        prompts.append(prompt)

        await ai_config.callback_manager.run_callbacks(
            CallbackEvent(
                "on_serialize_complete", __name__, {"result": prompts}
            )
        )

        return prompts

    async def deserialize(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        params: Optional[dict[Any, Any]] = {},
    ) -> dict[Any, Any]:
        """
        Defines how to parse a prompt in the .aiconfig for a particular model
        and constructs the completion params for that model.

        Args:
            serialized_data (str): Serialized data from the .aiconfig.

        Returns:
            dict: Model-specific completion parameters.
        """
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

        # Add image input
        completion_data[
            "image"
        ] = validate_and_retrieve_image_from_attachments(prompt)

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
                    "options": sanitized_options,
                    "parameters": parameters,
                },
            )
        )

        completion_data = await self.deserialize(prompt, aiconfig, parameters)

        # If api token is provided in the options, use it for the client
        client = self.client
        if run_override_api_token:
            client = InferenceClient(
                self.client.model, token=run_override_api_token
            )

        response = client.image_to_text(**completion_data)

        # HF Image to Text api doesn't support multiple outputs. Expect only one output.
        # Output spec: response is raw string
        outputs = [construct_output(response)]

        prompt.outputs = outputs

        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent("on_run_complete", __name__, {"result": outputs})
        )

        return outputs

    def get_output_text(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        output: Optional[Output] = None,
    ) -> str:
        if not output:
            output = aiconfig.get_latest_output(prompt)

        if not output:
            return ""

        if output.output_type == "execute_result":
            output_data = output.data
            if isinstance(output_data, str):
                return output_data
            else:
                raise ValueError(
                    f"Invalid output data type {type(output_data)} for prompt '{prompt.name}'. Expected string."
                )

        return ""


def validate_attachment_type_is_image(
    prompt_name: str,
    attachment: Attachment,
) -> None:
    """
    Simple helper function to verify that the mimetype is set to a valid
    image format. Raises ValueError if there's an issue.
    """
    if not hasattr(attachment, "mime_type"):
        raise ValueError(
            f"Attachment has no mime type for prompt '{prompt_name}'. Please specify the image mimetype in the AIConfig"
        )

    if not attachment.mime_type.startswith("image"):
        raise ValueError(
            f"Invalid attachment mimetype {attachment.mime_type} for prompt '{prompt_name}'. Please use a mimetype that starts with 'image/'."
        )


def validate_and_retrieve_image_from_attachments(
    prompt: Prompt,
) -> Union[ImageType, str]:
    """
    Retrieves the image uri's from each attachment in the prompt input.

    Throws an exception if
    - attachment is not image
    - attachment data is not a uri
    - no attachments are found
    - operation fails for any reason
    """

    if (
        not hasattr(prompt.input, "attachments")
        or len(prompt.input.attachments) == 0
    ):
        raise ValueError(
            f"No attachments found in input for prompt '{prompt.name}'. Please add an image attachment to the prompt input."
        )

    attachment = prompt.input.attachments[0]
    validate_attachment_type_is_image(prompt.name, attachment)

    if not isinstance(attachment.data, AttachmentDataWithStringValue):
        # See todo above, but for now only support uris and base64
        raise ValueError(
            f"""Attachment data must be of type `AttachmentDataWithStringValue` with a `kind` and `value` field.
                    Please specify a uri or base64 encoded string for the image attachment in prompt '{prompt.name}'."""
        )
    input_data = attachment.data.value
    if attachment.data.kind == "base64":
        pil_image: ImageType = img_module.open(
            BytesIO(base64.b64decode(input_data))
        )
        return pil_image
    else:
        return input_data
