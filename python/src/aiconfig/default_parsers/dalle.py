import copy
from typing import TYPE_CHECKING, Any, Dict, List, Optional

import openai
from aiconfig.default_parsers.parameterized_model_parser import ParameterizedModelParser
from aiconfig.util.config_utils import get_api_key_from_environment
from aiconfig.util.params import resolve_prompt
from openai import OpenAI

# Dall-E API imports
from openai.types import Image, ImagesResponse

from aiconfig.schema import ExecuteResult, Output, OutputDataWithStringValue, Prompt, PromptMetadata

# ModelParser Utils
# Type hint imports


# Circuluar Dependency Type Hints
if TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime


# Step 1: define Helpers


# TODO: Centralize this into utils function with the HuggingFaceTextParser class
def refine_image_completion_params(model_settings):
    """
    Refines the completion params for the Dall-E request API. Removes any unsupported params.
    The supported keys were found by looking at the OpenAI Dall-E API: https://platform.openai.com/docs/api-reference/images/create?lang=python`
    """
    supported_keys = {"model", "n", "quality", "response_format", "size", "style"}

    completion_data = {}
    for key in model_settings:
        if key.lower() in supported_keys:
            completion_data[key.lower()] = model_settings[key]

    return completion_data


def construct_output(image_data: Image, execution_count: int) -> Output:
    data = None
    if image_data.b64_json is not None:
        data = OutputDataWithStringValue(kind="base64", value=str(image_data.b64_json))
    elif image_data.url is not None:
        data = OutputDataWithStringValue(kind="file_uri", value=str(image_data.url))
    else:
        raise ValueError(f"Did not receive a valid image type from image_data: {image_data}")
    output = ExecuteResult(
        **{
            "output_type": "execute_result",
            "data": data,
            "execution_count": execution_count,
            "metadata": {"revised_prompt": image_data.revised_prompt},
            "mime_type": "image/png",
        }
    )
    return output


class DalleImageGenerationParser(ParameterizedModelParser):
    """
    A model parser for Dall-E 2 and Dall-E 3 text-->image generation models.
    """

    def __init__(self, model_id: str = "dall-e-3"):
        """
        Usage:

        1. Create a new model parser object
                parser = DalleImageGenerationParser("dall-e-3")
        2. Add the model parser to the registry.
                config.register_model_parser(parser)

        The model parser will require an API token to be set in the environment variable OPENAI_API_KEY.
        """
        super().__init__()

        supported_models = {
            "dall-e-2",
            "dall-e-3",
        }
        if model_id.lower() not in supported_models:
            raise ValueError("{model_id}" + " is not a valid model ID for Dall-E image generation. Supported models: {supported_models}.")
        self.model_id = model_id

        self.client = None

    def id(self) -> str:
        """
        Returns an identifier for the model (e.g. dall-e-2, dall-e-3, etc.).
        """
        return self.model_id

    async def serialize(
        self,
        prompt_name: str,
        data: Any,
        ai_config: "AIConfigRuntime",
        parameters: Optional[Dict] = None,
        **kwargs,
    ) -> List[Prompt]:
        """
        Defines how a prompt and model inference settings get serialized in the .aiconfig.

        Args:
            prompt (str): The prompt to be serialized.
            inference_settings (dict): Model-specific inference settings to be serialized.

        Returns:
            str: Serialized representation of the prompt and inference settings.
        """
        data = copy.deepcopy(data)

        # assume data is completion params for HF text generation
        prompt_input = data["prompt"]

        # Prompt is handled, remove from data
        data.pop("prompt", None)

        model_metadata = ai_config.get_model_metadata(data, self.id())
        prompt = Prompt(
            name=prompt_name,
            input=prompt_input,
            metadata=PromptMetadata(model=model_metadata, parameters=parameters, **kwargs),
        )
        return [prompt]

    # TODO (rossdanlm): Update documentation for args
    async def deserialize(self, prompt: Prompt, aiconfig: "AIConfigRuntime", params: Optional[Dict] = {}) -> Dict:
        """
        Defines how to parse a prompt in the .aiconfig for a particular model
        and constructs the completion params for that model.

        Args:
            Update this documentation... serialized_data (str): Serialized data from the .aiconfig.

        Returns:
            dict: Model-specific completion parameters.
        """
        # Get inputs from aiconfig
        resolved_prompt = resolve_prompt(prompt, params, aiconfig)
        model_settings = self.get_model_settings(prompt, aiconfig)

        # Build Completion data
        completion_data = refine_image_completion_params(model_settings)
        completion_data["prompt"] = resolved_prompt
        return completion_data

    async def run_inference(self, prompt: Prompt, aiconfig, _options, parameters) -> List[Output]:
        """
        Invoked to run a prompt in the .aiconfig. This method should perform
        the actual model inference based on the provided prompt and inference settings.

        Args:
            prompt (str): The input prompt.
            inference_settings (dict): Model-specific inference settings.

        Returns:
            InferenceResponse: The response from the model.
        """
        # If needed, certify the API key and initialize the OpenAI client
        if not openai.api_key:
            openai.api_key = get_api_key_from_environment("OPENAI_API_KEY")
        if not self.client:
            self.client = OpenAI(api_key=openai.api_key)

        completion_data = await self.deserialize(prompt, aiconfig, parameters)

        print("Calling image generation. This can take several seconds, please hold on...")
        response: ImagesResponse = self.client.images.generate(**completion_data)

        outputs = []
        # ImageResponse object also contains a "created" field for timestamp, should I store that somewhere?
        # Ex: response=ImagesResponse(created=1700347843, data=[...])
        for execution_count, image_data in enumerate(response.data):
            output = construct_output(image_data, execution_count)
            outputs.append(output)

        prompt.outputs = outputs
        return prompt.outputs

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

        # TODO (rossdanlm): Handle multiple outputs in list
        # https://github.com/lastmile-ai/aiconfig/issues/467
        if output.output_type == "execute_result":
            if isinstance(output.data, OutputDataWithValue):
                return output.data.value
            elif isinstance(output.data, str):
                return output.data
        return ""
