from aiconfig.schema import Prompt, PromptMetadata
from aiconfig.util.params import find_dependencies_in_prompt, get_dependency_graph, get_parameters_in_template
import pytest

""" Test cases for the get_parameters_in_template function."""
@pytest.fixture
def template_with_params():
    return """
        Hello {{name}}, welcome to {{prompt1.input}}!
        Your favorite color is {{prompt1.output}}.
    """


def test_empty_template():
    template = ""
    result = get_parameters_in_template(template)
    assert result == {}


def test_template_with_no_parameters():
    result = get_parameters_in_template("This is a plain text template.")
    assert result == {}

def test_template_with_empty_params():
    result = get_parameters_in_template("This is a plain text template with a fake param {{}}.")
    assert result == {}


def test_template_with_single_parameter():
    result = get_parameters_in_template("Hello, {{name}}!")
    assert result == {"name": True}


def test_template_with_single_prompt_input_parameter():
    result = get_parameters_in_template("Hello, {{prompt1.input}}!")
    assert result == {"prompt1": {"input": True}}


def test_template_with_single_prompt_output_parameter():
    result = get_parameters_in_template("Hello, {{prompt1.output}}!")
    assert result == {"prompt1": {"output": True}}


def test_template_with_multiple_parameters(template_with_params):
    result = get_parameters_in_template(template_with_params)
    expected_result = {
        "prompt1": {"input": True, "output": True},
        "name": True,
    }
    assert result == expected_result

""" Test cases for the find_dependencies_in_prompt function."""
@pytest.fixture
def prompt_list_with_5_prompts():
    prompt_list = [Prompt(name="prompt{}".format(i), input="I am the {i}'ths prompt's input".format(i=i), metadata=PromptMetadata(model="This Model Doesn't exist")) for i in range(5)]
    return prompt_list

def test_find_dependencies_in_prompt(prompt_list_with_5_prompts):

    # generate a list of 5 Prompts with name prompt1, prompt2, ... 
    prompt_template = "I am referring to {{prompt1.input}} and this {{prompt4.output}}" # only allowed to reference upstream prompts
    current_prompt_name = "prompt2"

    result = find_dependencies_in_prompt(prompt_template, current_prompt_name, prompt_list_with_5_prompts)

    assert result=={"prompt1"}

def test_find_dependencies_in_prompt_with_no_dependencies(prompt_list_with_5_prompts):

    # generate a list of 5 Prompts with name prompt1, prompt2, ... 
    prompt_template = "I am referring to {{}}"
    current_prompt_name = "prompt2"

    result = find_dependencies_in_prompt(prompt_template, current_prompt_name, prompt_list_with_5_prompts)

    assert not result

def test_find_dependencies_in_prompt_with_two_dependencies(prompt_list_with_5_prompts):

    # generate a list of 5 Prompts with name prompt1, prompt2, ... 
    prompt_template = "I am referring to {{prompt2.output}} and {{prompt1.output}}" # 
    current_prompt_name = "prompt4"

    result = find_dependencies_in_prompt(prompt_template, current_prompt_name, prompt_list_with_5_prompts)

    assert result=={"prompt1", "prompt2"}

def test_find_dependencies_in_prompt_with_no_prompt_reference(prompt_list_with_5_prompts):

    # generate a list of 5 Prompts with name prompt1, prompt2, ... 
    prompt_template = "I am referring to {{fakeprompt.output}} and {{fakeprompt.output}}" # should return none, no prompt references here
    current_prompt_name = "prompt4"

    result = find_dependencies_in_prompt(prompt_template, current_prompt_name, prompt_list_with_5_prompts)

    assert not result


# TODO: test edgecases and incorrect inputs, validate params.

""" Test cases for the get_dependency_graph function."""
def test_get_dependency_graph():
    """
    Test case for generating a dependency graph of prompts.

    Test Scenario:
    - Four prompts ('prompt1', 'prompt2', 'prompt3', 'prompt4') are defined with interdependencies.
    - 'prompt2' references 'prompt1' and 'prompt4'.
    - 'prompt3' references 'prompt2'.
    - 'prompt4' references 'prompt3' and 'prompt1'.
    - The 'get_dependency_graph' function is called with 'prompt4' as the root prompt.
    - The expected dependency graph is as follows:
        {
            "prompt4": ["prompt3", "prompt1"],
            "prompt3": ["prompt2"],
            "prompt2": ["prompt1"],
        }

    Note how prompt2's reference to prompt 4 gets skipped because we only handle upstream dependencies.
    """

    prompt_list = [
        Prompt(
            name="prompt1",
            input="I am the first prompt's input",
            metadata=PromptMetadata(model="This Model Doesn't exist"),
        ),
        Prompt(
            name="prompt2",
            input="I am referring to {{prompt1.input}} and this {{prompt4.output}}",
            metadata=PromptMetadata(model="This Model Doesn't exist"),
        ),
        Prompt(
            name="prompt3",
            input="I referring to {{prompt2.input}}",
            metadata=PromptMetadata(model="This Model Doesn't exist"),
        ),
        Prompt(
            name="prompt4",
            input="I am referring to {{prompt3.output}} and {{prompt1.output}}",
            metadata=PromptMetadata(model="This Model Doesn't exist"),
        ),
    ]
    prompt_dict = {prompt.name: prompt for prompt in prompt_list}

    dep_graph = get_dependency_graph(prompt_list[3], prompt_list, prompt_dict)
    # Convert list elements to sets for validation
    for key, value in dep_graph.items():
        assert isinstance(value, list)
        dep_graph[key] = set(value)

    # Modified dep_graph
    assert dep_graph == {
        "prompt4": {"prompt3", "prompt1"},
        "prompt3": {"prompt2"},
        "prompt2": {"prompt1"},
    }

def test_get_dependency_graph_with_no_dependencies():
    prompt_list = [Prompt(name="prompt1", input="I am the first prompt's input", metadata=PromptMetadata(model="This Model Doesn't exist")),
                   Prompt(name="prompt2", input="I am the second prompt's input with a param {{hey}}", metadata=PromptMetadata(model="This Model Doesn't exist")),
                   Prompt(name="prompt3", input="I am the third prompt's input", metadata=PromptMetadata(model="This Model Doesn't exist"))]
    prompt_dict = {prompt.name: prompt for prompt in prompt_list}

    dep_graph = get_dependency_graph(prompt_list[2], prompt_list, prompt_dict)
    # Convert list elements to sets for validation
    for key, value in dep_graph.items():
        assert isinstance(value, list)
        dep_graph[key] = set(value)

    # Modified dep_graph
    assert dep_graph == {}
