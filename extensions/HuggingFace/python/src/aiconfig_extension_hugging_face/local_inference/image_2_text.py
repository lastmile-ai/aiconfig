import base64
import json
from io import BytesIO
from PIL import Image
from typing import Any, Dict, Optional, List, TYPE_CHECKING, Union
from transformers import (
    Pipeline,
    pipeline,
)

from aiconfig_extension_hugging_face.local_inference.util import get_hf_model

from aiconfig.callback import CallbackEvent
from aiconfig.default_parsers.parameterized_model_parser import ParameterizedModelParser
from aiconfig.model_parser import InferenceOptions
from aiconfig.schema import (
    Attachment,
    ExecuteResult,
    Output,
    Prompt,
)

# Circular Dependency Type Hints
if TYPE_CHECKING:
    from aiconfig import AIConfigRuntime


class HuggingFaceImage2TextTransformer(ParameterizedModelParser):
    def __init__(self):
        """
        Returns:
            HuggingFaceImage2TextTransformer

        Usage:
        1. Create a new model parser object with the model ID of the model to use.
                parser = HuggingFaceImage2TextTransformer()
        2. Add the model parser to the registry.
                config.register_model_parser(parser)
        """
        super().__init__()
        self.pipelines: dict[str, Pipeline] = {}

    def id(self) -> str:
        """
        Returns an identifier for the Model Parser
        """
        return "HuggingFaceImage2TextTransformer"

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
        model_settings = self.get_model_settings(prompt, aiconfig)
        completion_params = refine_completion_params(model_settings)

        # Add image inputs
        inputs = validate_and_retrieve_images_from_attachments(prompt)
        completion_params["inputs"] = inputs

        await aiconfig.callback_manager.run_callbacks(CallbackEvent("on_deserialize_complete", __name__, {"output": completion_params}))
        return completion_params

    async def run_inference(self, prompt: Prompt, aiconfig: "AIConfigRuntime", options: InferenceOptions, parameters: Dict[str, Any]) -> List[Output]:
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_run_start",
                __name__,
                {"prompt": prompt, "options": options, "parameters": parameters},
            )
        )

        completion_data = await self.deserialize(prompt, aiconfig, parameters)
        inputs = completion_data.pop("inputs")

        model_name = get_hf_model(aiconfig, prompt, self)
        key = model_name if model_name is not None else "__default__"

        if key not in self.pipelines:
            self.pipelines[key] = pipeline(task="image-to-text", model=model_name)
        captioner = self.pipelines[key]

        outputs: List[Output] = []
        response: List[Any] = captioner(inputs, **completion_data)
        for count, result in enumerate(response):
            output: Output = construct_regular_output(result, count)
            outputs.append(output)

        prompt.outputs = outputs
        await aiconfig.callback_manager.run_callbacks(
            CallbackEvent(
                "on_run_complete",
                __name__,
                {"result": prompt.outputs},
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
            # HuggingFace image to text outputs should only ever be string
            # format so shouldn't get here, but just being safe
            return json.dumps(output_data, indent=2)
        return ""


def refine_completion_params(model_settings: Dict[str, Any]) -> Dict[str, Any]:
    """
    Refines the completion params for the HF image to text api. Removes any unsupported params.
    The supported keys were found by looking at the HF ImageToTextPipeline.__call__ method:
    https://github.com/huggingface/transformers/blob/cbbe30749b425f7c327acdab11473b33567a6e26/src/transformers/pipelines/image_to_text.py#L83
    """
    supported_keys = {
        "max_new_tokens",
        "timeout",
    }

    completion_data = {}
    for key in model_settings:
        if key.lower() in supported_keys:
            completion_data[key.lower()] = model_settings[key]

    return completion_data


# Helper methods
def construct_regular_output(result: Dict[str, str], execution_count: int) -> Output:
    """
    Construct regular output per response result, without streaming enabled
    """
    output = ExecuteResult(
        **{
            "output_type": "execute_result",
            # For some reason result is always in list format we haven't found
            # a way of being able to return multiple sequences from the image
            # to text pipeline
            "data": result[0]["generated_text"],
            "execution_count": execution_count,
            "metadata": {},
        }
    )
    return output


def validate_attachment_type_is_image(
    prompt_name: str,
    attachment: Attachment,
) -> None:
    """
    Simple helper function to verify that the mimetype is set to a valid
    image format. Raises ValueError if there's an issue.
    """
    if not hasattr(attachment, "mime_type"):
        raise ValueError(f"Attachment has no mime type for prompt '{prompt_name}'. Please specify the image mimetype in the AIConfig")

    if not attachment.mime_type.startswith("image/"):
        raise ValueError(f"Invalid attachment mimetype {attachment.mime_type} for prompt '{prompt_name}'. Please use a mimetype that starts with 'image/'.")


def validate_and_retrieve_images_from_attachments(prompt: Prompt) -> list[Union[str, Image]]:
    """
    Retrieves the image uri's from each attachment in the prompt input.

    Throws an exception if
    - attachment is not image
    - attachment data is not a uri
    - no attachments are found
    - operation fails for any reason
    """

    if not hasattr(prompt.input, "attachments") or len(prompt.input.attachments) == 0:
        raise ValueError(f"No attachments found in input for prompt '{prompt.name}'. Please add an image attachment to the prompt input.")

    images: list[Union[str, Image]] = []

    for i, attachment in enumerate(prompt.input.attachments):
        validate_attachment_type_is_image(prompt.name, attachment)

        input_data = attachment.data
        if not isinstance(input_data, str):
            # See todo above, but for now only support uris and base64
            raise ValueError(f"Attachment #{i} data is not a uri or base64 string. Please specify a uri or base64 encoded string for the image attachment in prompt '{prompt.name}'.")

        # Really basic heurestic to check if the data is a base64 encoded str
        # vs. uri. This will be fixed once we have standardized inputs
        # See https://github.com/lastmile-ai/aiconfig/issues/829
        if len(input_data) > 10000:
            pil_image: Image = Image.open(BytesIO(base64.b64decode(input_data)))
            images.append(pil_image)
        else:
            images.append(input_data)

    return images
