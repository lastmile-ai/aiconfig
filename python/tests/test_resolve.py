import openai
import pytest
from mock import patch

from aiconfig import AIConfigRuntime
from aiconfig.model_parser import InferenceOptions
from .conftest import mock_openai_chat_completion

from .util.file_path_utils import get_absolute_file_path_from_relative


@pytest.mark.asyncio
async def test_resolve_default_model_config_with_openai_parser():
    """
    Test that the default model config is resolved correctly. `basic_default_model_aiconfig.json` is an aiconfig with 1 prompt that has no settings or model defined besides the default.
    """
    config_relative_path = "aiconfigs/basic_default_model_aiconfig.json"
    config_absolute_path = get_absolute_file_path_from_relative(
        __file__, config_relative_path
    )
    config = AIConfigRuntime.load(config_absolute_path)
    resolved_params = await config.resolve("prompt1")

    assert resolved_params == {
        "messages": [
            {"content": "Hi! Tell me 10 cool things to do in NYC.", "role": "user"}
        ],
        "model": "gpt-3.5-turbo",
        "temperature": 1,
        "top_p": 1,
    }


@pytest.mark.asyncio
async def test_resolve_after_run():
    """
    After running a prompt, resolving the same prompt should return the same result as if it was never run assuming no parameters or dependencies are at play.

    This test is specific to the openai model parser
    """
    with patch.object(
        openai.chat.completions, "create", side_effect=mock_openai_chat_completion
    ):
        config_relative_path = "aiconfigs/basic_default_model_aiconfig.json"
        config_absolute_path = get_absolute_file_path_from_relative(
            __file__, config_relative_path
        )
        config = AIConfigRuntime.load(config_absolute_path)

        expected_resolved_params =  {
            "messages": [
                {"content": "Hi! Tell me 10 cool things to do in NYC.", "role": "user"}
            ],
            "model": "gpt-3.5-turbo",
            "temperature": 1,
            "top_p": 1,
        }

        resolved_params = await config.resolve("prompt1")
        assert resolved_params == expected_resolved_params

        # run the prompt, 
        await config.run("prompt1", options = InferenceOptions(stream=False))

        # Resolve it again, it should be the same
        resolved_params = await config.resolve("prompt1")
        assert resolved_params == expected_resolved_params