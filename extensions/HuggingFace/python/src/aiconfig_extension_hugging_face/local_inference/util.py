from typing import TYPE_CHECKING
from aiconfig import ParameterizedModelParser
from aiconfig.schema import Prompt


# Circular Dependency Type Hints
if TYPE_CHECKING:
    from aiconfig import AIConfigRuntime


def get_hf_model(aiconfig: "AIConfigRuntime", prompt: Prompt, model_parser: ParameterizedModelParser) -> str | None:
    """
    Returns the HuggingFace model to use for the given prompt and model parser.
    """
    model_name: str | None = aiconfig.get_model_name(prompt)
    model_settings = model_parser.get_model_settings(prompt, aiconfig)
    hf_model = model_settings.get("model") or None # Replace "" with None value

    if hf_model is not None and isinstance(hf_model, str):
        # If the model property is set in the model settings, use that.
        return hf_model
    elif model_name == model_parser.id():
        # If the model name is the name of the model parser itself,
        # then return None to signify using the default model for that HF task.
        return None
    else:
        # Otherwise the model name is the name of the model to use.
        return model_name
