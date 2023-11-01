import os
from typing import TYPE_CHECKING

import copy

from aiconfig.registry import ModelParserRegistry

if TYPE_CHECKING:
    from aiconfig import AIConfigSettings
    from aiconfig.AIConfigSettings import InferenceSettings
    from aiconfig.Config import AIConfigRuntime


def get_api_key_from_environment(api_key_name: str):
    if api_key_name not in os.environ:
        raise Exception("Missing API key '{}' in environment".format(api_key_name))

    return os.environ[api_key_name]


def extract_override_settings(
    config_runtime: "AIConfigSettings", inference_settings: "InferenceSettings", model_id: str
):
    """
    Extract inference settings with overrides based on inference settings.

    This function takes the inference settings and a model ID and returns a subset
    of inference settings that have been overridden by model-specific settings. It
    compares the provided settings with global settings, and returns only those that
    differ or have no corresponding global setting.

    Args:
        settings (InferenceSettings): The inference settings.
        model_id (str): The model id.

    Returns:
        InferenceSettings: The inference settings with overrides from global settings.
    """
    model_name = model_id
    global_model_settings = config_runtime.get_global_settings(model_name)

    if global_model_settings:
        # Identify the settings that differ from global settings
        override_settings = {
            key: copy.deepcopy(inference_settings[key])
            for key in inference_settings
            if key not in global_model_settings
            or global_model_settings.get(key) != inference_settings[key]
        }
        return override_settings
    return inference_settings


def update_model_parser_registry_with_config_runtime(config_runtime: "AIConfigRuntime"):
    """
    Updates the model parser registry with the model parsers from the AIConfigRuntime.

    Args:
        config_runtime (AIConfigRuntime): The AIConfigRuntime.
    """
    if not config_runtime.metadata.model_parsers:
        return
    for model_id, model_parser_id in config_runtime.metadata.model_parsers:
        if 
        ModelParserRegistry.register_model_parser(model_parser)
