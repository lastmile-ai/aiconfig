from typing import Any

from huggingface_hub import InferenceClient


def add_default_model_if_not_set(
    completion_data: dict[Any, Any], hf_task: str
):
    """
    add default model from task based on Remote Inference Default model

    Takes a dictionary of completion data and adds a default model if it is not
    already set.

    Most tasks have a default model specified for a task. Skip any that don't
    """
    default_model = None

    try:
        default_model = InferenceClient.get_recommended_model(task=hf_task)
    except Exception:
        # No default model, don't set one
        pass

    if default_model is not None and "model" not in completion_data:
        completion_data["model"] = default_model

    return completion_data
