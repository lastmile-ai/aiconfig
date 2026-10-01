import base64
import copy
import io
import itertools
import json
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Tuple, Union

import torch
from aiconfig.default_parsers.parameterized_model_parser import (
    ParameterizedModelParser,
)
from aiconfig.model_parser import InferenceOptions
from aiconfig.util.params import resolve_prompt
from aiconfig_extension_hugging_face.local_inference.util import get_hf_model
from aiconfig_extension_hugging_face.local_inference.text_2_image_params import (
    prepare_pipeline_creation_params,
    refine_image_completion_params,
    refine_pipeline_creation_params,
)
from diffusers import AutoPipelineForText2Image
from diffusers.pipelines.stable_diffusion import StableDiffusionPipelineOutput
from diffusers.pipelines.stable_diffusion_xl.pipeline_output import (
    StableDiffusionXLPipelineOutput,
)
from PIL import Image
from transformers import Pipeline

from aiconfig.schema import (
    ExecuteResult,
    Output,
    OutputDataWithStringValue,
    Prompt,
    PromptMetadata,
)

# Circuluar Dependency Type Hints
if TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime


class ImageData:
    """
    Helper class to store each image response data as fields instead
    of separate arrays. See `_refine_responses` for more details
    """

    image: Image.Image
    nsfw_content_detected: bool

    def __init__(self, image: Image.Image, nsfw_content_detected: bool):
        self.image = image
        self.nsfw_content_detected = nsfw_content_detected


def construct_output(image_data: ImageData, execution_count: int) -> Output:
    """
    Construct output based on the response data
    """

    # TODO (rossdanlm): These 64 bit strings can be extremely long (ex: the Stable
    # Diffusion XL model output in
    # https://github.com/lastmile-ai/aiconfig/pull/460#issuecomment-1851376017
    # is 1.36 MB, 1,424,248 chars).
    # Would be nice to save images locally with local URL instead.
    # https://github.com/lastmile-ai/aiconfig/issues/468
    def pillow_image_to_base64_string(img: Image.Image):
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode("utf-8")

    data = OutputDataWithStringValue(
        kind="base64",
        value=pillow_image_to_base64_string(image_data.image),
    )
    output = ExecuteResult(
        **{
            "output_type": "execute_result",
            "data": data,
            "execution_count": execution_count,
            "metadata": {
                "nsfw_content_detected": image_data.nsfw_content_detected
            },
            "mime_type": "image/png",
        }
    )
    return output


class HuggingFaceText2ImageDiffusor(ParameterizedModelParser):
    """
    A model parser for HuggingFace models of type text to image task using transformers.
    These support the two most common diffsion models: Stable Diffusion and Stable
    Diffusion XL. More details here:
    https://huggingface.co/docs/diffusers/using-diffusers/conditional_image_generation#popular-models
    """

    def __init__(self):
        """
        Returns:
            HuggingFaceText2ImageDiffusor

        Usage:
        1. Create a new model parser object with the model ID of the model to use.
                parser = HuggingFaceText2ImageDiffusor()
        2. Add the model parser to the registry.
                config.register_model_parser(parser)
        """
        super().__init__()
        self.generators: dict[str, Pipeline] = {}

    def id(self) -> str:
        """
        Returns an identifier for the Model Parser
        """
        return "HuggingFaceText2ImageDiffusor"

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
            inference_settings (dict): Model-specific inference settings to be serialized.

        Returns:
            str: Serialized representation of the prompt and inference settings.
        """
        data = copy.deepcopy(data)

        # assume data is completion params for HF text to image task:
        # https://huggingface.co/docs/diffusers/main/en/api/pipelines/stable_diffusion/text2img#diffusers.StableDiffusionPipeline.__call__
        # TODO (rossdanlm): Figure out how to check for StableDiffusionXLPipeline
        prompt_input = data["prompt"]

        # Prompt is handled, remove from data
        data.pop("prompt", None)

        # TODO (rossdanlm): Handle attachments for image generation to save outputs
        # https://github.com/lastmile-ai/aiconfig/issues/417
        model_metadata = ai_config.get_model_metadata(data, self.id())
        prompt = Prompt(
            name=prompt_name,
            input=prompt_input,
            metadata=PromptMetadata(
                model=model_metadata,
                parameters=parameters,
                **completion_params,
            ),
        )
        return [prompt]

    async def deserialize(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        _options,
        params: Optional[Dict[str, Any]] = {},
    ) -> Dict[str, Any]:
        """
        Defines how to parse a prompt in the .aiconfig for a particular model
        and constructs the completion params for that model.

        Args:
            serialized_data (str): Serialized data from the .aiconfig.

        Returns:
            dict: Model-specific completion parameters.
        """
        # Build Completion data
        model_settings = self.get_model_settings(prompt, aiconfig)
        [
            _pipeline_creation_params,
            unfiltered_completion_params,
        ] = refine_pipeline_creation_params(model_settings)
        completion_data = refine_image_completion_params(
            unfiltered_completion_params
        )

        # Add resolved prompt
        resolved_prompt = resolve_prompt(prompt, params, aiconfig)
        completion_data["prompt"] = resolved_prompt
        return completion_data

    async def run_inference(
        self,
        prompt: Prompt,
        aiconfig: "AIConfigRuntime",
        options: InferenceOptions,
        parameters: Dict[str, Any],
    ) -> List[Output]:
        """
        Invoked to run a prompt in the .aiconfig. This method should perform
        the actual model inference based on the provided prompt and inference settings.

        Args:
            prompt (str): The input prompt.
            inference_settings (dict): Model-specific inference settings.

        Returns:
            InferenceResponse: The response from the model.
        """
        model_settings = self.get_model_settings(prompt, aiconfig)
        pipeline_creation_data = prepare_pipeline_creation_params(model_settings)

        pipeline_building_disclaimer_message = """
Building the pipeline... This can take a long time if you haven't created one before 
on this machine. Please be patient!

If this seems to be taking too long, you can change some of the pipeline generation
params. See more details here:
https://huggingface.co/docs/diffusers/using-diffusers/loading
"""
        print(pipeline_building_disclaimer_message)

        model_name = get_hf_model(aiconfig, prompt, self)
        key = model_name if model_name is not None else "__default__"

        # TODO (rossdanlm): Figure out a way to save model and re-use checkpoint
        # Otherwise right now a lot of these models are taking 5 mins to load with 50
        # num_inference_steps (default value). See here for more details:
        # https://huggingface.co/docs/diffusers/using-diffusers/loading#checkpoint-variants
        if key not in self.generators:
            device = self._get_device()
            self.generators[key] = AutoPipelineForText2Image.from_pretrained(
                pretrained_model_or_path=model_name, **pipeline_creation_data
            ).to(device)
        generator = self.generators[key]

        disclaimer_long_response_print_message = """\n
Calling image generation. This can take a long time, (up to SEVERAL MINUTES depending
on the model), please hold on...

If this seems to be taking too long, you can change some of the params. For example, 
you can set the `num_inference_steps` to a lower value at the cost of reduced image
quality. See full list of params here:
https://huggingface.co/docs/diffusers/main/en/api/pipelines/stable_diffusion/text2img#diffusers.StableDiffusionPipeline.__call__

If that doesn't work, you can also try less computationally intensive models. 
        """
        print(disclaimer_long_response_print_message)

        completion_data = await self.deserialize(
            prompt, aiconfig, options, parameters
        )
        response: Union[
            StableDiffusionPipelineOutput, StableDiffusionXLPipelineOutput
        ] = generator(**completion_data)
        nsfw_content_detected = []
        if hasattr(response, "nsfw_content_detected"):
            # StableDiffusionPipelineOutput has "nsfw_content_detected" field  but
            # StableDiffusionXLPipelineOutput does not. Both have "images" field
            nsfw_content_detected = response.nsfw_content_detected

        outputs: List[Output] = []
        # TODO (rossdanlm): Check if "image" field is present for other image
        # diffusers other than StableDiffusion and StableDiffusionXL
        # https://github.com/lastmile-ai/aiconfig/issues/471
        refined_responses = _refine_responses(
            response.images or [], nsfw_content_detected
        )
        for count, image_data in enumerate(refined_responses):
            # TODO (rossdanlm): It's possible for image to be of type np.ndarray
            # Update `construct_output` to process this type.
            # See StableDiffusionPipelineOutput
            output = construct_output(image_data, count)
            outputs.append(output)

        prompt.outputs = outputs
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
            if isinstance(output_data, OutputDataWithStringValue):
                return output_data.value
            # HuggingFace text to image outputs should only ever be in
            # outputDataWithStringValue format so shouldn't get here, but
            # just being safe
            if isinstance(output_data, str):
                return output_data
            return json.dumps(output_data, indent=2)
        return ""

    def _get_device(self) -> str:
        if torch.cuda.is_available():
            return "cuda"
        if torch.backends.mps.is_available():
            return "mps"
        return "cpu"


def _refine_responses(
    response_images: List[Image.Image],
    nsfw_content_detected: List[bool],
) -> List[ImageData]:
    """
    Helper function for taking the separate response data lists (`images` and
    `nsfw_content_detected`) from StableDiffusionPipelineOutput or
    StableDiffusionXLPipelineOutput and merging this data into a single array
    containing ImageData which stores information at the image-level. This
    makes processing later easier since all the data we need is stored in a
    single object, so we don't need to compare two separate lists

    Args:
        response_images List[Image.Image]: List of images
        nsfw_content_detected List[bool]: List of whether the image at that
            corresponding index from `response_images` has detected that it
            contains nsfw_content. It is possible for this list to be empty

    Returns:
        List[ImageData]: List containing ImageData, which merges both array
            information into a single data object
    """
    merged_responses: List[Tuple[Image.Image, bool]] = list(
        # Use zip.longest because nsfw_content_detected can be empty
        itertools.zip_longest(response_images, nsfw_content_detected)
    )
    image_data_objects: List[ImageData] = [
        ImageData(image=image, nsfw_content_detected=has_nsfw)
        for (image, has_nsfw) in merged_responses
    ]
    return image_data_objects
