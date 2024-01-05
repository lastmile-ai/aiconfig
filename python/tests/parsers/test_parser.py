import pytest
from aiconfig.Config import AIConfigRuntime

from aiconfig.schema import ConfigMetadata, ModelMetadata, Prompt, PromptMetadata

from ..util.mock_parser import MockModelParser


@pytest.fixture
def ai_config_runtime():
    runtime = AIConfigRuntime.create("Untitled AIConfig")
    return runtime


def test_get_model_settings(ai_config_runtime: AIConfigRuntime):
    """
    Test the get_model_settings_for_prompt method of the AIConfig class.
    3 cases:
    1. settings is defined as an empty dictionary
    2. settings is defined under prompt metadata
    3. settings is defined under config metadata. This is essentially the final default
    4. settings is defined under config metadata, but model and not settings is defined under prompt metadata. This should default to the config metadata
    """
    mock_model_parser = MockModelParser()

    prompt = Prompt(
        name="Prompt1",
        input="input doesn't matter here",
        metadata=PromptMetadata(
            model="fake model",
        ),
    )
    ai_config_runtime.add_prompt(prompt.name, prompt)

    prompt = ai_config_runtime.prompts[0]

    assert mock_model_parser.get_model_settings(prompt, ai_config_runtime) == {}

    # settings is defined as {}. Should be returned as {}
    aiconfig = AIConfigRuntime(
        name="test",
        metadata=ConfigMetadata(**{"models": {"fakemodel": {"fake_setting": "True"}}}),
        #  here is settings = None. This implies that settings were not passed in. Should default to global params
        prompts=[
            Prompt(
                name="test",
                input="test",
                metadata=PromptMetadata(model=ModelMetadata(name="test", settings={})),
            )
        ],
    )

    prompt = aiconfig.prompts[0]

    assert mock_model_parser.get_model_settings(prompt, aiconfig) == {}
    # settings is defined as None. Should be returned as config level, ie {"fake_setting": "True"}
    aiconfig = AIConfigRuntime(
        name="test",
        metadata=ConfigMetadata(**{"models": {"fakemodel": {"fake_setting": "True"}}}),
        #  here is settings = None. This implies that settings were not passed in. Should default to global params
        prompts=[
            Prompt(
                name="test",
                input="test",
                metadata=PromptMetadata(model=ModelMetadata(name="fakemodel", settings=None)),
            )
        ],
    )

    prompt = aiconfig.prompts[0]

    assert mock_model_parser.get_model_settings(prompt, aiconfig) == {"fake_setting": "True"}

    with pytest.raises(IndexError, match=r"Prompt '.*' not in config"):
        prompt = Prompt(
            name="doesn't exist",
            input="doesn't exist",
            metadata=PromptMetadata(model="doesn't exist"),
        )
        mock_model_parser.get_model_settings(prompt, aiconfig)
