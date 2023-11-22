import pytest
from aiconfig.Config import AIConfigRuntime
from aiconfig.util.params import collect_prompt_references

from aiconfig.schema import ConfigMetadata, ModelMetadata, Prompt, PromptMetadata

from .util.file_path_utils import get_absolute_file_path_from_relative

"""
The tests in this file are intended to test the functionality of the class methods of the AIConfig and related clases (prompt, etc).
Mainly testing that data is able to be retrieved correctly, ie prompt.getmodelname() returns the correct model name, etc.
"""

# Unit tests for the Prompt class


def test_get_model_name_from_cell_data():
    """basic test to get model name from cell data"""
    config_manager = AIConfigRuntime.create()
    # load a config

    # TODO: implement this test for get_model_name_from_cell_data()


@pytest.fixture
def ai_config_runtime():
    runtime = AIConfigRuntime.create("Untitled AIConfig")
    return runtime


def test_collect_prompt_references():
    """
    Test the collection of prompt references within an AI configuration.

    Collects prompt references for the third prompt (index 2) from an AIConfig instance
    with four prompts. Prompt 4, which is after the third prompt in the sequence, is expected
    to not be included in the collected references.
    """

    # input is an aiconfig with a 4 prompts. Test collects prompt references for the 3rd prompt
    # collect_prompt_references should return references to 1 and 2. 3 is the prompt we are collecting references for, 4 is after. Both are expected to be skipped
    config_relative_path = "aiconfigs/GPT4 Coding Assistant_aiconfig.json"
    config_absolute_path = get_absolute_file_path_from_relative(
        __file__, config_relative_path
    )
    aiconfig = AIConfigRuntime.load(config_absolute_path)

    prompt3 = aiconfig.prompts[2]

    prompt_references = collect_prompt_references(prompt3, aiconfig)

    assert prompt_references == {
        "code_gen": {
            "input": "Write me a function to do {{business_logic}} in {{language}}. ",
            "output": None,
        },
        "refactor_cell": {
            "input": "Refactor {{code_gen.output}} and add comments",
            "output": None,
        },
    }


def test_collect_prompt_references_with_outputs():
    """
    Test the collection of prompt references with expected outputs
    """
    pass


def test_resolve_prompt():
    """basic test to resolve prompt"""
    config_manager = AIConfigRuntime.create()
    # load a config

    # TODO: implement this test for resolve_prompt()
