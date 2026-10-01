from typing import Any, Dict, List


def refine_pipeline_creation_params(
    model_settings: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """Separate Diffusers pipeline-construction options from call options.

    Pipeline options follow the ``AutoPipelineForText2Image.from_pretrained``
    API. They are distinct from arguments passed to the generated pipeline's
    ``__call__`` method.
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
        "requires_safety_checker",
    }

    pipeline_creation_params: Dict[str, Any] = {}
    completion_params: Dict[str, Any] = {}
    for key in model_settings:
        if key.lower() in supported_keys:
            pipeline_creation_params[key.lower()] = model_settings[key]
        elif key.lower() == "kwargs" and isinstance(model_settings[key], Dict):
            completion_params.update(model_settings[key])
        else:
            completion_params[key.lower()] = model_settings[key]

    return [pipeline_creation_params, completion_params]


def refine_image_completion_params(
    unfiltered_completion_params: Dict[str, Any],
) -> Dict[str, Any]:
    """Keep only arguments accepted by the text-to-image pipeline call."""
    supported_keys = {
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
    }

    return {
        key.lower(): value
        for key, value in unfiltered_completion_params.items()
        if key.lower() in supported_keys
    }


def prepare_pipeline_creation_params(
    model_settings: Dict[str, Any],
) -> Dict[str, Any]:
    """Apply the parser's existing safety-checker construction option.

    Diffusers disables the safety checker by passing ``safety_checker=None``
    when loading the pipeline.
    """
    pipeline_creation_params, _ = refine_pipeline_creation_params(model_settings)
    if not pipeline_creation_params.get("requires_safety_checker", True):
        pipeline_creation_params["safety_checker"] = None
    return pipeline_creation_params
