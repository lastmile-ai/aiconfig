import pytest
from aiconfig.Config import AIConfigRuntime

from aiconfig.schema import Prompt, PromptMetadata


@pytest.mark.asyncio
async def test_serialize_basic(set_temporary_env_vars: None):
    # Test with one input prompt and system. No output
    completion_params = {
        "model": "dall-e-3",
        "n": 1,
        "prompt": "Panda eating dumplings on a yellow mountain",
        "size": "1024x1024",
    }
    aiconfig = AIConfigRuntime.create()
    serialized_prompts = await aiconfig.serialize(
        "dall-e-3", completion_params, prompt_name="panda_eating_dumplings"
    )
    new_prompt = serialized_prompts[0]
    assert new_prompt == Prompt(
        name="panda_eating_dumplings",
        input="Panda eating dumplings on a yellow mountain",
        metadata=PromptMetadata(
            **{
                "model": {
                    "name": "dall-e-3",
                    "settings": {"model": "dall-e-3", "n": 1, "size": "1024x1024"},
                },
            }
        ),
        outputs=[],
    )
