import importlib.util
from pathlib import Path
from types import ModuleType, SimpleNamespace

import pytest


def load_attachment_utils() -> ModuleType:
    util_path = (
        Path(__file__).parents[1]
        / "src"
        / "aiconfig_extension_hugging_face"
        / "local_inference"
        / "attachment_utils.py"
    )
    spec = importlib.util.spec_from_file_location("hf_local_inference_attachment_utils", util_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


require_attachments = load_attachment_utils().require_attachments


def test_none_attachments_raises_parser_validation_error():
    prompt_input = SimpleNamespace(attachments=None)

    with pytest.raises(ValueError, match="No attachments found.*image attachment"):
        require_attachments(prompt_input, "image_prompt", "an image")
