import importlib.util
from pathlib import Path
from types import ModuleType


def load_text_to_image_params() -> ModuleType:
    params_path = (
        Path(__file__).parents[1]
        / "src"
        / "aiconfig_extension_hugging_face"
        / "local_inference"
        / "text_2_image_params.py"
    )
    spec = importlib.util.spec_from_file_location("hf_text_to_image_params", params_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


_params = load_text_to_image_params()


def test_safety_checker_setting_is_routed_to_pipeline_construction():
    model_settings = {
        "requires_safety_checker": False,
        "num_inference_steps": 12,
    }

    pipeline_kwargs = _params.prepare_pipeline_creation_params(model_settings)
    _, unfiltered_completion = _params.refine_pipeline_creation_params(model_settings)
    inference_kwargs = _params.refine_image_completion_params(unfiltered_completion)

    assert pipeline_kwargs["safety_checker"] is None
    assert "requires_safety_checker" not in inference_kwargs
    assert inference_kwargs["num_inference_steps"] == 12
    assert _params.prepare_pipeline_creation_params({}) == {}
