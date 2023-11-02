from aiconfig import AIConfigRuntime
from mock import patch
import openai
import pytest


@pytest.mark.asyncio
async def test_resolve_default_model_config_with_openai_parser():
    """
    Test that the default model config is resolved correctly. `basic_default_model_aiconfig.json` is an aiconfig with 1 prompt that has no settings or model defined besides the default.
    """
    config = AIConfigRuntime.from_config("aiconfigs/basic_default_model_aiconfig.json")
    resolved_params = await config.resolve("prompt1")

    assert resolved_params == {
        "messages": [{"content": "Hi! Tell me 10 cool things to do in NYC.", "role": "user"}],
        "model": "gpt-3.5-turbo",
        "temperature": 1,
        "top_p": 1,
    }
