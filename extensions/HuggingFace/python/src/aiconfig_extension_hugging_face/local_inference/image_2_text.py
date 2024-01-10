from typing import Any, Dict, Optional, List, TYPE_CHECKING
from aiconfig import ParameterizedModelParser, InferenceOptions
from aiconfig.callback import CallbackEvent
import torch
from aiconfig.schema import Prompt, Output, ExecuteResult, Attachment

from transformers import pipeline, Pipeline

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
        completion_params = self.get_model_settings(prompt, aiconfig)

        inputs = validate_and_retrieve_image_from_attachments(prompt)

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

        self.pipelines[model_name] = pipeline(task="image-to-text", model=model_name)

        captioner = self.pipelines[model_name]
        completion_data = await self.deserialize(prompt, aiconfig, parameters)
        inputs = completion_data.pop("inputs")
        model = completion_data.pop("model")
        response = captioner(inputs, **completion_data)

        output = ExecuteResult(output_type="execute_result", data=response, metadata={})

        prompt.outputs = [output]
        await aiconfig.callback_manager.run_callbacks(CallbackEvent("on_run_complete", __name__, {"result": prompt.outputs}))
        return prompt.outputs

    def get_output_text(self, response: dict[str, Any]) -> str:
        raise NotImplementedError("get_output_text is not implemented for HuggingFaceImage2TextTransformer")


def validate_attachment_type_is_image(attachment: Attachment):
    if not hasattr(attachment, "mime_type"):
        raise ValueError(f"Attachment has no mime type. Specify the image mimetype in the aiconfig")

    if not attachment.mime_type.startswith("image/"):
        raise ValueError(f"Invalid attachment mimetype {attachment.mime_type}. Expected image mimetype.")


def validate_and_retrieve_image_from_attachments(prompt: Prompt) -> list[str]:
    """
    Retrieves the image uri's from each attachment in the prompt input.

    Throws an exception if
    - attachment is not image
    - attachment data is not a uri
    - no attachments are found
    - operation fails for any reason
    """

    if not hasattr(prompt.input, "attachments") or len(prompt.input.attachments) == 0:
        raise ValueError(f"No attachments found in input for prompt {prompt.name}. Please add an image attachment to the prompt input.")

    image_uris: list[str] = []

    for i, attachment in enumerate(prompt.input.attachments):
        validate_attachment_type_is_image(attachment)

        if not isinstance(attachment.data, str):
            # See todo above, but for now only support uri's
            raise ValueError(f"Attachment #{i} data is not a uri. Please specify a uri for the image attachment in prompt {prompt.name}.")

        image_uris.append(attachment.data)

    return image_uris
