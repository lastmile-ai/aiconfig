import base64
import copy
import io
import itertools
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union
from diffusers import AutoPipelineForText2Image
from diffusers.pipelines.stable_diffusion import StableDiffusionPipelineOutput
from diffusers.pipelines.stable_diffusion_xl.pipeline_output import StableDiffusionXLPipelineOutput
from PIL import Image
from transformers import Pipeline


from aiconfig.default_parsers.parameterized_model_parser import ParameterizedModelParser
from aiconfig.model_parser import InferenceOptions
from aiconfig.schema import ExecuteResult, Output, Prompt, PromptMetadata
from aiconfig.util.params import resolve_prompt

# Circuluar Dependency Type Hints
if TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime


# Step 1: define Helpers
def refine_pipeline_creation_params(model_settings: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Refines the pipeline creation params for the HF text2Image generation api. 
    Defers unsupported params as completion params, where they can get processed in 
    `refine_image_completion_params()`. The supported keys were found by looking at
    the HF text2Image API: 
    https://huggingface.co/docs/diffusers/v0.24.0/en/api/pipelines/auto_pipeline#diffusers.AutoPipelineForText2Image

    Note that this is not the same as the image completion params, which are passed to 
    the pipeline later to generate the image: 
    https://huggingface.co/docs/diffusers/main/en/api/pipelines/stable_diffusion/text2img#diffusers.StableDiffusionPipeline.__call__
    """

    supported_keys = {
        "torch_dtype",
        "force_download",
        "cache_dir",
        "resume_download",
        "proxies",
        "output_loading_info",
        "local_files_only",
        "use_auth_token",
        "revision",
        "custom_revision",
        "mirror",
        "device_map",
        "max_memory",
        "offload_folder",
        "offload_state_dict",
        "low_cpu_mem_usage",
        "use_safetensors",
        "variant",
    }

    pipeline_creation_params : Dict[str, Any] = {}
    completion_params : Dict[str, Any] = {}
    for key in model_settings:
        if key.lower() in supported_keys:
            pipeline_creation_params[key.lower()] = model_settings[key]
        else:
            if key.lower() == "kwargs" and isinstance(model_settings[key], Dict):
                completion_params.update(model_settings[key])
            else:
                completion_params[key.lower()] = model_settings[key]

    return [pipeline_creation_params, completion_params]

def refine_image_completion_params(unfiltered_completion_params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Refines the image creation params for the HF text2Image generation api after a 
    pipeline has been created via `refine_pipeline_creation_params`. Removes any 
    unsupported params. The supported keys were found by looking at the HF text2Image 
    API for StableDiffusionPipeline: 
    https://huggingface.co/docs/diffusers/main/en/api/pipelines/stable_diffusion/text2img#diffusers.StableDiffusionPipeline.__call__
    
    Note: Can't find the supported keys or API for StableDiffusionXLPipeline:
    https://huggingface.co/docs/diffusers/main/en/using-diffusers/sdxl

    Note that this is not the same as the pipeline completion params, which were passed 
    earlier to generate the pipeline: 
    https://huggingface.co/docs/diffusers/v0.24.0/en/api/pipelines/auto_pipeline#diffusers.AutoPipelineForText2Image
    """

    supported_keys = {
        # "prompt",
        "height",
        "width",
        "num_inference_steps",
        "guidance_scale",
        "negative_prompt",
        "num_images_per_prompt",
        "eta",
        "generator",
        "latents",
        "prompt_embeds",
        "negative_prompt_embeds",
        "output_type",
        "return_dict",
        "callback",
        "callback_steps",
        "cross_attention_kwargs",
        "guidance_rescale",
        "clip_skip",
        "requires_safety_checker",
    }

    completion_params : Dict[str, Any] = {}
    for key in unfiltered_completion_params:
        if key.lower() in supported_keys:
            completion_params[key.lower()] = unfiltered_completion_params[key]

    return completion_params


def construct_regular_output(
        image: Image.Image, 
        has_nsfw: Optional[bool],
        execution_count: int
    ) -> Output:
    """
    Construct output based on the response data
    """
    # TODO (rossdanlm): These 64 bit strings can be extremely long (ex: the Stable
    # Diffusion XL model output in
    # https://github.com/lastmile-ai/aiconfig/pull/460#issuecomment-1851376017
    # is 1.36 MB, 1,424,248 chars).
    # Would be nice to save images locally with local URL instead.
    def pillow_image_to_base64_string(img : Image.Image):
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode("utf-8")

    output = ExecuteResult(
        **{
            "output_type": "execute_result",
            "data": pillow_image_to_base64_string(image),
            "execution_count": execution_count,
            "metadata": {"has_nsfw": has_nsfw},
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
        self.generators : dict[str, Pipeline]= {}

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
    ) -> Prompt:
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
        model_metadata = ai_config.get_model_metadata(data, self.id())
        prompt = Prompt(
            name=prompt_name,
            input=prompt_input,
            metadata=PromptMetadata(
                model=model_metadata, parameters=parameters, **completion_params
            ),
        )
        return prompt

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
        [_pipeline_creation_params, unfiltered_completion_params] = refine_pipeline_creation_params(model_settings)
        completion_data = refine_image_completion_params(unfiltered_completion_params)
        
        #Add resolved prompt
        resolved_prompt = resolve_prompt(prompt, params, aiconfig)
        completion_data["prompt"] = resolved_prompt
        return completion_data

    async def run_inference(
        self, prompt: Prompt, aiconfig : "AIConfigRuntime", options : InferenceOptions, parameters: Dict[str, Any]
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
        [pipeline_creation_data, _] = refine_pipeline_creation_params(model_settings)
        if not pipeline_creation_data.get("requires_safety_checker", True):
            pipeline_creation_data["safety_checker"] = None

        pipeline_building_disclaimer_message = """
Building the pipeline... This can take a long time if you haven't created one before 
on this machine. Please be patient!

If this seems to be taking too long, you can change some of the pipeline generation
params. See more details here:
https://huggingface.co/docs/diffusers/using-diffusers/loading
"""     
        print(pipeline_building_disclaimer_message)
        model_name : str = aiconfig.get_model_name(prompt)
        # TODO (rossdanlm): Figure out a way to save model and re-use checkpoint
        # Otherwise right now a lot of these models are taking 5 mins to load with 50
        # num_inference_steps (default value). See here for more details:
        # https://huggingface.co/docs/diffusers/using-diffusers/loading#checkpoint-variants
        if isinstance(model_name, str) and model_name not in self.generators:
            self.generators[model_name] = AutoPipelineForText2Image.from_pretrained(
                pretrained_model_or_path=model_name,
                safety_checker=None,
                **pipeline_creation_data
            )
        generator = self.generators[model_name]

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
        
        completion_data = await self.deserialize(prompt, aiconfig, options, parameters)
        response : Union[StableDiffusionPipelineOutput, StableDiffusionXLPipelineOutput] = generator(**completion_data)
        has_nsfw_responses = []
        if hasattr(response, 'nsfw_content_detected'): 
            # StableDiffusionPipelineOutput has "nsfw_content_detected" field  but
            # StableDiffusionXLPipelineOutput does not. Both have "images" field
            has_nsfw_responses = response.nsfw_content_detected
        
        outputs : List[Output] = []
        for count, (image, has_nsfw) in enumerate(
            itertools.zip_longest(
                # TODO (rossdanlm): Check if "image" field is present for other image
                # diffusers other than StableDiffusion and StableDiffusionXL
                response.images or [],
                has_nsfw_responses,
            )
        ):
            output = construct_regular_output(image, has_nsfw, count)
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

        if output.output_type == "execute_result":
            if isinstance(output.data, str):
                return output.data
        else:
            return ""
