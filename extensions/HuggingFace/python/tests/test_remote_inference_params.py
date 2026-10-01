from aiconfig_extension_hugging_face.remote_inference_client.text_generation import (
    refine_completion_params,
)


def test_refine_completion_params_preserves_temperature():
    assert refine_completion_params({"temperature": 0.25}) == {
        "temperature": 0.25,
        "max_new_tokens": 400,
    }
