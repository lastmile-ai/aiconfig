import copy
import dotenv
import os
from typing import TYPE_CHECKING, Union

if TYPE_CHECKING:
    pass

    from aiconfig.schema import InferenceSettings

    from ..schema import AIConfig


def maybe_get_api_key_from_environment(
    api_key_name: str,
    required: bool = True) -> Union[str, None]:
    """Get the API key if it exists, return None or error if it doesn't

    Args:
        api_key_name (str): The keyname that we're trying to import from env variable
        required (bool, optional): If this is true, we raise an error if the 
            key is not found

    Returns:
        Union[str, None]: the value of the key. If `required` is false, this can be None
    """
    dotenv.load_dotenv()
    if required:
        _get_api_key_from_environment(api_key_name)
    return os.getenv(api_key_name)

def _get_api_key_from_environment(api_key_name: str) -> str:
    if api_key_name not in os.environ:
        raise KeyError(f"Missing API key '{api_key_name}' in environment")
    return os.environ[api_key_name]


def extract_override_settings(config_runtime: "AIConfig", inference_settings: "InferenceSettings", model_id: str):
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
            if key not in global_model_settings or global_model_settings.get(key) != inference_settings[key]
        }
        return override_settings
    return inference_settings


def is_yaml_ext(file_path: str):
    """
    Check if the file extension is YAML.
    """
    _, ext = os.path.splitext(file_path)
    return ext in [".yaml", ".yml"]
