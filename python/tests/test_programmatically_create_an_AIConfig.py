import pytest
from aiconfig_tools.Config import AIConfigRuntime
from aiconfig_tools.AIConfigSettings import (
    AIConfig,
    ConfigMetadata,
    ExecuteResult,
    InferenceSettings,
    ModelMetadata,
    Prompt,
    PromptMetadata,
)


@pytest.fixture
def ai_config_runtime():
    runtime = AIConfigRuntime.create("Untitled AIConfig")
    return runtime


def test_create_empty_config_with_defaults(ai_config_runtime):
    """
    Test creating an empty AIConfig with default values.
    """
    config: AIConfig = ai_config_runtime

    # Ensure the AIConfig is created with default values
    assert config.metadata == ConfigMetadata()
    assert config.prompt_index == {}
    assert config.prompts == []
    assert config.schema_version == "latest"
    assert config.name == "Untitled AIConfig"


def test_add_model_to_config(ai_config: AIConfig):
    """
    Test adding a new model to the config's metadata.
    """
    model_name = "new_model"
    model_settings = {"setting1": "value1", "setting2": "value2"}

    ai_config.add_model(model_name, model_settings)

    # Ensure the model is added to the config's metadata
    assert model_name in ai_config.metadata.models
    assert ai_config.metadata.models[model_name] == model_settings


def test_delete_model_from_config(ai_config):
    """
    Test deleting an existing model.
    """
    model_name = "existing_model"
    model_settings = {"setting1": "value1", "setting2": "value2"}

    ai_config.add_model(model_name, model_settings)

    ai_config.delete_model(model_name)

    # Ensure the model is deleted from the config's metadata
    assert model_name not in ai_config.metadata.models


def test_delete_nonexistent_model(ai_config: AIConfig):
    """
    Test deleting a non-existent model (expect an exception).
    """
    non_existent_model = "non_existent_model"

    # Ensure trying to delete a non-existent model raises an exception
    with pytest.raises(Exception, match=f"Model '{non_existent_model}' does not exist."):
        ai_config.delete_model(non_existent_model)


def test_add_prompt_to_config(ai_config_runtime: AIConfigRuntime):
    """
    Test adding a prompt to the AIConfig.
    """
    config = ai_config_runtime

    prompt_data = Prompt(
        name="prompt1", input="This is a prompt", metadata=PromptMetadata(model="fakemodel")
    )

    config.add_prompt("prompt1", prompt_data)

    # Ensure the prompt is added correctly
    assert config.prompt_index["prompt1"].name == "prompt1"
    assert config.prompt_index["prompt1"].input == "This is a prompt"
    assert config.prompt_index["prompt1"].metadata.model == "fakemodel"

    # Ensure prompt list is in sync with prompt index
    assert config.prompts[0] == config.prompt_index["prompt1"]


def test_delete_prompt_from_config(ai_config_runtime):
    """
    Test deleting a prompt from the AIConfig.
    """
    config = ai_config_runtime

    prompt_data = Prompt(
        name="prompt1", input="This is a prompt", metadata=PromptMetadata(model="fakemodel")
    )

    config.add_prompt("prompt1", prompt_data)
    assert len(config.prompt_index) == 1
    assert len(config.prompts) == 1

    config.delete_prompt("prompt1")

    # Ensure the prompt is deleted correctly
    assert config.prompt_index == {}
    assert config.prompts == []
    assert len(config.prompt_index) == 0


def test_update_prompt_in_config(ai_config_runtime):
    """
    Test updating a prompt in the AIConfig.
    """
    config: AIConfig = ai_config_runtime

    prompt_data = Prompt(
        name="prompt1", input="This is a prompt", metadata=PromptMetadata(model="fakemodel")
    )

    config.add_prompt("prompt1", prompt_data)

    updated_prompt_data = Prompt(
        name="prompt1", input="Updated prompt", metadata=PromptMetadata(model="updatedmodel")
    )

    config.update_prompt("prompt1", updated_prompt_data)

    # Ensure the prompt is updated correctly
    assert config.prompt_index["prompt1"].input == "Updated prompt"
    assert config.prompt_index["prompt1"].metadata.model == "updatedmodel"
    # Ensure prompt list is in sync with prompt index
    assert config.prompts[0] == config.prompt_index["prompt1"]


def test_create_config_with_name():
    """
    Test creating an AIConfig with a specific name.
    """
    config_runtime = AIConfigRuntime.create("My AIConfig")

    config = config_runtime

    assert config.name == "My AIConfig"


def test_create_config_with_schema_version():
    """
    Test creating an AIConfig with a specific schema version.
    """
    config_runtime = AIConfigRuntime.create("AIConfig with Schema", schema_version="v1")

    config = config_runtime

    assert config.schema_version == "v1"


def test_add_prompt_with_duplicate_name(ai_config_runtime: AIConfigRuntime):
    """
    Test adding a prompt with a duplicate name.
    """
    config = ai_config_runtime

    prompt_data1 = Prompt(
        name="prompt1", input="This is a prompt", metadata=PromptMetadata(model="fakemodel")
    )
    prompt_data2 = Prompt(
        name="prompt1", input="Duplicate prompt", metadata=PromptMetadata(model="fakemodel")
    )

    config.add_prompt("prompt1", prompt_data1)

    # Ensure adding a prompt with a duplicate name raises an exception
    with pytest.raises(Exception, match=r"Prompt with name prompt1 already exists."):
        config.add_prompt("prompt1", prompt_data2)


def test_update_nonexistent_prompt(ai_config_runtime: AIConfigRuntime):
    """
    Test updating a nonexistent prompt.
    """
    config = ai_config_runtime

    prompt_data = Prompt(
        name="prompt1", input="This is a prompt", metadata=PromptMetadata(model="fakemodel")
    )

    # Ensure updating a nonexistent prompt raises an exception
    with pytest.raises(IndexError, match=r"Prompt not found in config"):
        config.update_prompt("nonexistent_prompt", prompt_data)


def test_delete_nonexistent_prompt(ai_config_runtime: AIConfigRuntime):
    """
    Test deleting a nonexistent prompt.
    """
    config = ai_config_runtime

    # Ensure deleting a nonexistent prompt raises an exception
    with pytest.raises(IndexError, match=r"Prompt not found in config"):
        config.delete_prompt("nonexistent_prompt")


def test_get_metadata_with_nonexistent_prompt(ai_config_runtime: AIConfigRuntime):
    """
    Test the retrieval of metadata from a non-existent prompt.
    """
    config = ai_config_runtime
    prompt_name = "nonexistent_prompt"

    # Ensure that attempting to retrieve metadata for a non-existent prompt raises an exception
    with pytest.raises(IndexError, match=f"Prompt '{prompt_name}' not found in config"):
        config.get_metadata(prompt_name)


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


@pytest.fixture
def ai_config():
    config = AIConfig(
        name="Untitled AIConfig", schema_version="latest", metadata=ConfigMetadata(), prompts=[]
    )
    return config


def test_set_global_parameter(ai_config: AIConfig):
    """
    Test setting a global parameter.
    """
    parameter_name = "global_param"
    parameter_value = "global_value"

    ai_config.set_parameter(parameter_name, parameter_value, prompt_name=None)

    # Ensure the global parameter is set correctly
    assert ai_config.metadata.parameters[parameter_name] == parameter_value


def test_set_parameter_for_prompt(ai_config: AIConfig):
    """
    Test setting a parameter for a specific prompt.
    """
    prompt_name = "prompt1"
    parameter_name = "prompt_param"
    parameter_value = "prompt_value"

    # Create a sample prompt for testing
    prompt_data = Prompt(
        name=prompt_name, input="This is a prompt", metadata=PromptMetadata(model="fakemodel")
    )
    ai_config.add_prompt(prompt_name, prompt_data)

    ai_config.set_parameter(parameter_name, parameter_value, prompt_name=prompt_name)

    # Ensure the parameter is set for the specific prompt
    assert (
        ai_config.prompt_index[prompt_name].metadata.parameters[parameter_name] == parameter_value
    )
    assert ai_config.prompts[0].metadata.parameters[parameter_name] == parameter_value


def test_update_existing_parameter(ai_config: AIConfig):
    """
    Test updating an existing parameter.
    """
    parameter_name = "existing_param"
    initial_value = "initial_value"
    updated_value = "updated_value"

    ai_config.set_parameter(parameter_name, initial_value, prompt_name=None)
    ai_config.update_parameter(parameter_name, updated_value, prompt_name=None)

    # Ensure the existing parameter is updated correctly
    assert ai_config.metadata.parameters[parameter_name] == updated_value


def test_delete_existing_parameter(ai_config: AIConfig):
    """
    Test deleting an existing parameter.
    """
    parameter_name_to_delete = "param_to_delete"
    parameter_value = "param_value"

    ai_config.set_parameter(parameter_name_to_delete, parameter_value, prompt_name=None)
    ai_config.delete_parameter(parameter_name_to_delete, prompt_name=None)

    # Ensure the existing parameter is deleted correctly
    assert parameter_name_to_delete not in ai_config.metadata.parameters


def test_load_saved_config(tmp_path):
    """
    Test loading a saved AIConfig from a JSON file.
    """
    config_runtime = AIConfigRuntime.create("My AIConfig")

    # Create a configuration-level parameter
    config_runtime.set_parameter("config_param", "config_value", prompt_name=None)

    # Create a sample prompt for testing
    prompt_data = Prompt(
        name="prompt1", input="This is a prompt", metadata=PromptMetadata(model="fakemodel")
    )
    config_runtime.add_prompt("prompt1", prompt_data)

    # Set a prompt-level parameter
    config_runtime.set_parameter("prompt_param", "prompt_value", prompt_name="prompt1")

    json_config_filepath = tmp_path / "my_aiconfig.json"
    config_runtime.save(json_config_filepath)

    loaded_config = AIConfigRuntime.from_config(json_config_filepath)

    # Ensure the loaded AIConfig contains the expected data
    assert loaded_config.name == "My AIConfig"
    assert loaded_config.metadata.parameters == {"config_param": "config_value"}
    assert "prompt1" in loaded_config.prompt_index
    assert loaded_config.prompt_index["prompt1"].metadata.parameters == {
        "prompt_param": "prompt_value"
    }


def test_set_config_name(ai_config_runtime: AIConfigRuntime):
    ai_config_runtime.set_name("My AIConfig")
    assert ai_config_runtime.name == "My AIConfig"


def test_set_description(ai_config_runtime: AIConfigRuntime):
    ai_config_runtime.set_description("This is a description")
    assert ai_config_runtime.description == "This is a description"


def test_get_prompt_existing(ai_config_runtime: AIConfigRuntime):
    """Test retrieving an existing prompt by name."""
    prompt = Prompt(
        name="GreetingPrompt",
        input="Hello, how are you?",
        metadata=PromptMetadata(model="fakemodel"),
    )
    ai_config_runtime.add_prompt(prompt.name, prompt)
    retrieved_prompt = ai_config_runtime.get_prompt("GreetingPrompt")
    assert retrieved_prompt == prompt


def test_get_prompt_after_deleting_previous(ai_config_runtime: AIConfigRuntime):
    prompt1 = Prompt(
        name="GreetingPrompt",
        input="Hello, how are you?",
        metadata=PromptMetadata(model="fakemodel"),
    )
    prompt2 = Prompt(
        name="GoodbyePrompt",
        input="Goodbye, see you later!",
        metadata=PromptMetadata(model="fakemodel"),
    )
    ai_config_runtime.add_prompt(prompt1.name, prompt1)
    ai_config_runtime.add_prompt(prompt2.name, prompt2)
    ai_config_runtime.delete_prompt("GreetingPrompt")
    retrieved_prompt = ai_config_runtime.get_prompt("GoodbyePrompt")
    assert retrieved_prompt == prompt2


def test_get_prompt_nonexistent(ai_config_runtime: AIConfigRuntime):
    with pytest.raises(IndexError, match=r"Prompt 'GreetingPrompt' not found in config"):
        ai_config_runtime.get_prompt("GreetingPrompt")


def test_update_model_ai_config(ai_config_runtime: AIConfigRuntime):
    model_metadata = {"name": "testmodel", "settings": {"topP": 0.9}}
    ai_config_runtime.update_model(model_metadata)
    assert ai_config_runtime.metadata.models["testmodel"] == ModelMetadata(
        **{"name": "testmodel", "settings": {"topP": 0.9}}
    )


def test_update_model_specific_prompt(ai_config_runtime: AIConfigRuntime):
    """Test updating model metadata for a specific prompt."""
    model_metadata = {"name": "testmodel", "settings": {"topP": 0.9}}
    prompt1 = Prompt(
        name="GreetingPrompt",
        input="Hello, how are you?",
        metadata=PromptMetadata(model="fakemodel"),
    )
    ai_config_runtime.add_prompt(prompt1.name, prompt1)
    ai_config_runtime.update_model(model_metadata, "GreetingPrompt")
    assert ai_config_runtime.get_prompt("GreetingPrompt").metadata.model == ModelMetadata(
        **model_metadata
    )


def test_update_model_empty_metadata(ai_config_runtime: AIConfigRuntime):
    """Test updating with an empty model_metadata dictionary."""
    model_metadata = {}

    with pytest.raises(
        KeyError,
        match=r"Cannot update model. Model metadata must contain a 'name' element. Optionally, it may contain a 'settings' element.",
    ):
        ai_config_runtime.update_model(model_metadata)


def test_set_metadata_ai_config(ai_config_runtime: AIConfigRuntime):
    """Test setting metadata at the AIConfig level."""
    model_metadata = {"name": "testmodel", "settings": {"topP": 0.9}}
    ai_config_runtime.update_model(model_metadata)
    assert ai_config_runtime.get_metadata().models["testmodel"] == ModelMetadata(**model_metadata)


def test_set_and_delete_metadata_ai_config(ai_config_runtime: AIConfigRuntime):
    """Test deleting an existing metadata key at the AIConfig level."""
    ai_config_runtime.set_metadata("testkey", "testvalue")

    assert ai_config_runtime.get_metadata().testkey == "testvalue"

    ai_config_runtime.delete_metadata("testkey")

    assert hasattr(ai_config_runtime.get_metadata(), "testkey") is False


def test_set_and_delete_metadata_ai_config_prompt(ai_config_runtime: AIConfigRuntime):
    """Test deleting a non-existent metadata key at the AIConfig level."""
    prompt1 = Prompt(
        name="GreetingPrompt",
        input="Hello, how are you?",
        metadata=PromptMetadata(model="fakemodel"),
    )
    ai_config_runtime.add_prompt(prompt1.name, prompt1)
    ai_config_runtime.set_metadata("testkey", "testvalue", "GreetingPrompt")

    assert ai_config_runtime.get_prompt("GreetingPrompt").metadata.testkey == "testvalue"

    ai_config_runtime.delete_metadata("testkey", "GreetingPrompt")

    assert hasattr(ai_config_runtime.get_prompt("GreetingPrompt").metadata, "testkey") is False

def test_add_output_existing_prompt_no_overwrite(ai_config_runtime: AIConfigRuntime):
    """Test adding an output to an existing prompt without overwriting."""
    prompt1 = Prompt(
        name="GreetingPrompt",
        input="Hello, how are you?",
        metadata=PromptMetadata(model="fakemodel"),
    )
    ai_config_runtime.add_prompt(prompt1.name, prompt1)
    test_result = ExecuteResult(output_type='execute_result', execution_count=0.0, data={'role': 'assistant', 'content': 'test output'}, metadata={'finish_reason': 'stop'})
    ai_config_runtime.add_output("GreetingPrompt", test_result)

          
    assert ai_config_runtime.get_latest_output("GreetingPrompt") == test_result 

    
    test_result2 = ExecuteResult(output_type='execute_result', execution_count=0.0, data={'role': 'assistant', 'content': 'test output'}, metadata={'finish_reason': 'stop'})
    ai_config_runtime.add_output("GreetingPrompt", test_result2)
    assert ai_config_runtime.get_latest_output("GreetingPrompt") == test_result2

    ai_config_runtime.delete_output("GreetingPrompt")

    assert ai_config_runtime.get_latest_output("GreetingPrompt") == None