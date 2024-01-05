import pytest
from aiconfig.Config import AIConfigRuntime

from aiconfig.schema import AIConfig, ConfigMetadata, Prompt, PromptMetadata


@pytest.fixture
def ai_config_runtime():
    runtime = AIConfigRuntime.create("Untitled AIConfig")
    return runtime


@pytest.fixture
def ai_config():
    config = AIConfig(
        name="Untitled AIConfig",
        schema_version="latest",
        metadata=ConfigMetadata(),
        prompts=[],
    )
    return config


def test_delete_nonexistent_parameter(ai_config_runtime: AIConfigRuntime):
    """
    Test deleting a nonexistent parameter.
    """
    config = ai_config_runtime
    parameter_name_to_delete = "param1"
    config.add_prompt(
        "prompt1",
        Prompt(
            name="prompt_name",
            input="This is a prompt",
            metadata=PromptMetadata(model="fakemodel"),
        ),
    )

    # Ensure deleting a nonexistent parameter raises a KeyError
    with pytest.raises(KeyError, match=f"Parameter '{parameter_name_to_delete}' does not exist."):
        config.delete_parameter(parameter_name_to_delete)


def test_set_parameter_for_aiconfig_empty_params(ai_config: AIConfig):
    """
    Test setting a global parameter when there are no global params set before.
    We should create a new set of params.
    """
    prompt_name = "prompt1"
    prompt_parameter_name = "prompt_param"
    prompt_parameter_value = "prompt_value"
    prompt = Prompt(
        name=prompt_name,
        input="This is a prompt",
        metadata=PromptMetadata(
            model="fakemodel",
            parameters={
                prompt_parameter_name: prompt_parameter_value,
            },
        ),
    )
    ai_config.add_prompt(prompt_name, prompt)

    assert ai_config.metadata.parameters == {}
    aiconfig_parameter_name = "aiconfig_param"
    aiconfig_parameter_value = "aiconfig_value"
    ai_config.set_parameter(aiconfig_parameter_name, aiconfig_parameter_value)

    # Ensure the global parameter is set correctly
    assert prompt.metadata is not None
    assert prompt.metadata.parameters == {
        prompt_parameter_name: prompt_parameter_value,
    }
    assert ai_config.metadata.parameters is not None
    assert ai_config.metadata.parameters == {
        aiconfig_parameter_name: aiconfig_parameter_value,
    }


def test_set_parameter_for_aiconfig_has_parameters(ai_config: AIConfig):
    """
    Test setting a global parameter when it already has parameters.
    It should overwrite the value for key that is the same and keep
    the others unchanged.
    """
    prompt_name = "prompt1"
    prompt_parameter_name = "prompt_param"
    prompt_parameter_value = "prompt_value"
    prompt = Prompt(
        name=prompt_name,
        input="This is a prompt",
        metadata=PromptMetadata(
            model="fakemodel",
            parameters={
                prompt_parameter_name: prompt_parameter_value,
            },
        ),
    )
    ai_config.add_prompt(prompt_name, prompt)

    aiconfig_parameter_name = "aiconfig_param"
    ai_config.metadata = ConfigMetadata(
        parameters={
            "random_key": "keep this parameter",
            aiconfig_parameter_name: "should update this value",
        }
    )
    aiconfig_parameter_value = "aiconfig_value"
    ai_config.set_parameter(aiconfig_parameter_name, aiconfig_parameter_value)

    # Ensure the global parameter is set correctly
    assert prompt.metadata is not None
    assert prompt.metadata.parameters == {
        prompt_parameter_name: prompt_parameter_value,
    }
    assert ai_config.metadata.parameters is not None
    assert ai_config.metadata.parameters == {
        "random_key": "keep this parameter",
        aiconfig_parameter_name: aiconfig_parameter_value,
    }


def test_set_parameter_for_prompt_no_metadata(ai_config: AIConfig):
    """
    Test setting a prompt parameter when there is no prompt metadata.
    """
    prompt_name = "prompt1"
    prompt = Prompt(
        name=prompt_name,
        input="This is a prompt",
    )
    ai_config.add_prompt(prompt_name, prompt)

    aiconfig_parameter_name = "aiconfig_param"
    aiconfig_parameter_value = "aiconfig_value"
    ai_config.metadata = ConfigMetadata(
        parameters={
            aiconfig_parameter_name: aiconfig_parameter_value,
        }
    )

    assert prompt.metadata is None
    prompt_parameter_name = "prompt_param"
    prompt_parameter_value = "prompt_value"
    ai_config.set_parameter(prompt_parameter_name, prompt_parameter_value, prompt_name)

    # Ensure the prompt parameter is set correctly
    assert prompt.metadata is not None
    assert prompt.metadata.parameters == {
        prompt_parameter_name: prompt_parameter_value,
    }
    assert ai_config.metadata.parameters is not None
    assert ai_config.metadata.parameters == {
        aiconfig_parameter_name: aiconfig_parameter_value,
    }


def test_set_parameter_for_prompt_no_parameters(ai_config: AIConfig):
    """
    Test setting a prompt parameter when there are no prompt parameters.
    """
    prompt_name = "prompt1"
    prompt = Prompt(
        name=prompt_name,
        input="This is a prompt",
        metadata=PromptMetadata(model="fakemodel"),
    )
    ai_config.add_prompt(prompt_name, prompt)

    aiconfig_parameter_name = "aiconfig_param"
    aiconfig_parameter_value = "aiconfig_value"
    ai_config.metadata = ConfigMetadata(
        parameters={
            aiconfig_parameter_name: aiconfig_parameter_value,
        }
    )

    assert prompt.metadata is not None
    assert prompt.metadata.parameters == {}
    prompt_parameter_name = "prompt_param"
    prompt_parameter_value = "prompt_value"
    ai_config.set_parameter(prompt_parameter_name, prompt_parameter_value, prompt_name)

    # Ensure the prompt parameter is set correctly
    assert prompt.metadata is not None
    assert prompt.metadata.parameters == {
        prompt_parameter_name: prompt_parameter_value,
    }
    assert ai_config.metadata.parameters is not None
    assert ai_config.metadata.parameters == {
        aiconfig_parameter_name: aiconfig_parameter_value,
    }


def test_set_parameter_for_prompt_has_parameters(ai_config: AIConfig):
    """
    Test setting a prompt parameter when it already has parameters.
    It should overwrite the value for key that is the same and keep
    the others unchanged.
    """
    prompt_name = "prompt1"
    prompt_parameter_name = "prompt_param"
    prompt = Prompt(
        name=prompt_name,
        input="This is a prompt",
        metadata=PromptMetadata(
            model="fakemodel",
            parameters={
                "random_key": "keep this parameter",
                prompt_parameter_name: "should update this value",
            },
        ),
    )
    ai_config.add_prompt(prompt_name, prompt)

    aiconfig_parameter_name = "aiconfig_param"
    aiconfig_parameter_value = "aiconfig_value"
    ai_config.metadata = ConfigMetadata(
        parameters={
            aiconfig_parameter_name: aiconfig_parameter_value,
        }
    )

    prompt_parameter_value = "prompt_value"
    ai_config.set_parameter(prompt_parameter_name, prompt_parameter_value, prompt_name)

    # Ensure the prompt parameter is set correctly
    assert prompt.metadata is not None
    assert prompt.metadata.parameters == {
        "random_key": "keep this parameter",
        prompt_parameter_name: prompt_parameter_value,
    }
    assert ai_config.metadata.parameters is not None
    assert ai_config.metadata.parameters == {
        aiconfig_parameter_name: aiconfig_parameter_value,
    }


def test_update_existing_parameter(ai_config: AIConfig):
    """
    Test updating an existing parameter.
    """
    parameter_name = "existing_param"
    initial_value = "initial_value"
    updated_value = "updated_value"

    ai_config.set_parameter(parameter_name, initial_value, prompt_name=None)
    ai_config.update_parameter(parameter_name, updated_value, prompt_name=None)

    assert ai_config.metadata.parameters is not None
    assert ai_config.metadata.parameters[parameter_name] == updated_value


def test_delete_existing_parameter(ai_config: AIConfig):
    """
    Test deleting an existing parameter.
    """
    parameter_name_to_delete = "param_to_delete"
    parameter_value = "param_value"

    ai_config.set_parameter(parameter_name_to_delete, parameter_value, prompt_name=None)
    ai_config.delete_parameter(parameter_name_to_delete, prompt_name=None)

    assert ai_config.metadata.parameters is not None
    assert parameter_name_to_delete not in ai_config.metadata.parameters


# | With both local and global (should use local override)
# | Without AIConfig but local is `{}` |
def test_get_parameter_prompt_has_parameters(ai_config: AIConfig):
    """
    Test getting a parameter for a prompt
    """
    prompt_name = "prompt1"
    prompt_data = Prompt(
        name=prompt_name,
        input="This is a prompt",
        metadata=PromptMetadata(model="fakemodel"),
    )
    ai_config.add_prompt(prompt_name, prompt_data)

    parameter_name = "param1"
    parameter_value = "param_value"
    ai_config.set_parameter(
        parameter_name,
        parameter_value,
        prompt_name=prompt_name,
    )

    ai_config.set_parameter(
        "this value",
        "does not matter",
        prompt_name=None,
    )

    parameters = ai_config.get_parameters(prompt_name)
    assert ai_config.prompt_index["prompt1"].metadata is not None
    assert parameters == ai_config.prompt_index["prompt1"].metadata.parameters


def test_get_parameter_prompt_has_no_metadata(
    ai_config: AIConfig,
):
    """
    Test getting a parameter when only aiconfig param is set.
    Prompt does not have metadata.
    """
    prompt_name = "prompt1"
    prompt_data = Prompt(
        name=prompt_name,
        input="This is a prompt",
    )
    ai_config.add_prompt(prompt_name, prompt_data)

    parameter_name = "param1"
    parameter_value = "param_value"
    ai_config.set_parameter(
        parameter_name,
        parameter_value,
        prompt_name=None,
    )

    parameters = ai_config.get_parameters(prompt_name)
    assert parameters == ai_config.metadata.parameters


def test_get_parameter_prompt_has_metadata_no_parameters(ai_config: AIConfig):
    """
    Test getting a parameter when only aiconfig param is set.
    Prompt has metadata but no parameters.
    """
    prompt_name = "prompt1"
    prompt_data = Prompt(
        name=prompt_name,
        input="This is a prompt",
        metadata=PromptMetadata(model="fakemodel"),
    )
    ai_config.add_prompt(prompt_name, prompt_data)

    parameter_name = "param1"
    parameter_value = "param_value"
    ai_config.set_parameter(
        parameter_name,
        parameter_value,
        prompt_name=None,
    )

    parameters = ai_config.get_parameters(prompt_name)
    assert parameters == ai_config.metadata.parameters


def test_get_parameter_prompt_has_empty_parameters(ai_config: AIConfig):
    """
    Test getting a parameter when only aiconfig param is set.
    Prompt has empty parameters.
    """
    prompt_name = "prompt1"
    prompt_data = Prompt(
        name=prompt_name,
        input="This is a prompt",
        metadata=PromptMetadata(model="fakemodel", parameters={}),
    )
    ai_config.add_prompt(prompt_name, prompt_data)

    parameter_name = "param1"
    parameter_value = "param_value"
    ai_config.set_parameter(
        parameter_name,
        parameter_value,
        prompt_name=None,
    )

    parameters = ai_config.get_parameters(prompt_name)
    assert parameters == ai_config.metadata.parameters


def test_get_parameter_prompt_has_empty_parameters(ai_config: AIConfig):
    """
    Test getting a parameter when only aiconfig param is set.
    Prompt has empty parameters.
    """
    prompt_name = "prompt1"
    prompt_data = Prompt(
        name=prompt_name,
        input="This is a prompt",
        metadata=PromptMetadata(model="fakemodel", parameters={}),
    )
    ai_config.add_prompt(prompt_name, prompt_data)

    parameter_name = "param1"
    parameter_value = "param_value"
    ai_config.set_parameter(
        parameter_name,
        parameter_value,
        prompt_name=None,
    )

    parameters = ai_config.get_parameters(prompt_name)
    assert parameters == ai_config.metadata.parameters


def test_get_parameter_aiconfig_has_parameters(ai_config: AIConfig):
    """
    Test getting a parameter for an aiconfig
    """
    prompt_name = "prompt1"
    prompt_data = Prompt(
        name=prompt_name,
        input="This is a prompt",
        metadata=PromptMetadata(model="fakemodel"),
    )
    ai_config.add_prompt(prompt_name, prompt_data)

    ai_config.set_parameter(
        "this does",
        "this matter",
        prompt_name=prompt_name,
    )

    parameter_name = "param1"
    parameter_value = "param_value"
    ai_config.set_parameter(
        parameter_name,
        parameter_value,
        prompt_name=None,
    )

    parameters = ai_config.get_parameters()
    assert parameters == ai_config.metadata.parameters


def test_get_parameter_aiconfig_no_parameters(ai_config: AIConfig):
    """
    Test getting a parameter for an aiconfig when no parameters are set
    on the aiconfig
    """
    prompt_name = "prompt1"
    prompt_data = Prompt(
        name=prompt_name,
        input="This is a prompt",
        metadata=PromptMetadata(model="fakemodel"),
    )
    ai_config.add_prompt(prompt_name, prompt_data)

    ai_config.set_parameter(
        "this does",
        "this matter",
        prompt_name=prompt_name,
    )

    parameters = ai_config.get_parameters()
    assert parameters == {}


def test_get_parameter_prompt_no_parameters(ai_config: AIConfig):
    """
    Test getting a parameter for a prompt when no parameters are set
    on either the prompt of the aiconfig
    """
    prompt_name = "prompt1"
    prompt_data = Prompt(
        name=prompt_name,
        input="This is a prompt",
        metadata=PromptMetadata(model="fakemodel"),
    )
    ai_config.add_prompt(prompt_name, prompt_data)

    parameters = ai_config.get_parameters()
    assert parameters == {}
