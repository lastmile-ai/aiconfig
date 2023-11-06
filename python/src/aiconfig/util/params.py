import re
from collections import defaultdict
from typing import TYPE_CHECKING, Dict, List, Set
from aiconfig.schema import Prompt
from aiconfig.registry import ModelParserRegistry

import cachetools

from pybars import Compiler

if TYPE_CHECKING:
    from ..Config import AIConfigRuntime, AIConfig


def get_parameters_in_template(template) -> dict:
    """
    Extracts parameters referenced in the given Handlebars template.

    Args:
        template (str): The Handlebars template string.

    Returns:
        dict: A dictionary containing the extracted parameters in the template.
              The structure is {context: {parameter: True}}
              For example:
              {
                "test": { "input": True, "output": True },
                "tweet_chapter": { "input": True, "output": True }
              }
    """

    # Regular expression pattern to match Handlebars tags
    re_pattern = r"{{[{]?(.*?)[}]?}}"

    # Find all Handlebars tags in the template
    tags = [match.group(1).strip() for match in re.finditer(re_pattern, template)]

    # Initialize a dictionary to store parameters
    root = defaultdict(lambda: defaultdict(bool))
    context = root
    stack = []

    def set_var(variable, val):
        """
        Helper function to set a variable in the current context.

        Args:
            variable (str): The variable name.
            val (bool): The value to set (True).

        Returns:
            None
        """
        if "." in variable and " " not in variable:
            notation = variable.split(".")
            context[notation[0]][notation[1]] = True
        else:
            context[variable.strip()] = val

    for tag in tags:
        if not tag:
            continue
        if tag.startswith("! "):
            continue
        elif tag == "else":
            continue
        elif tag[0] in "#^" and " " not in tag:
            set_var(tag[1:], True)
            stack.append(context)
        elif tag.startswith("#if"):
            vars = tag.split(" ")[1:]
            for v in vars:
                set_var(v, True)
            stack.append(context)
        elif tag.startswith("/if"):
            context = stack.pop()
        elif tag.startswith("#with "):
            v = tag.split(" ")[1]
            new_context = {}
            context[v] = new_context
            stack.append(context)
            context = new_context
        elif tag.startswith("/with"):
            context = stack.pop()
        elif tag.startswith("#unless "):
            v = tag.split(" ")[1]
            set_var(v, True)
            stack.append(context)
        elif tag.startswith("/unless"):
            context = stack.pop()
        elif tag.startswith("#each "):
            v = tag.split(" ")[1]
            new_context = {}
            context[v] = [new_context]
            stack.append(context)
            context = new_context
        elif tag.startswith("/each"):
            context = stack.pop()
        elif tag.startswith("/"):
            context = stack.pop()
        else:
            set_var(tag, True)

    return dict(root)


def validate_params(params: dict):
    """params must contain only letters, numbers, and underscores"""
    """dot notation will allow .input and .output"""
    for param in params:
        if isinstance(params[param], dict):
            if len(set(params[param].values()) - set(["input", "output"])) > 0:
                raise Exception("Invalid parameter: {}".format(param))
        else:
            if not re.match("^[a-zA-Z0-9_.]*$", params[param]):
                raise Exception("Invalid parameter: {}".format(param))


def resolve_parametrized_prompt(raw_prompt, params):
    """Paramterizes input Prompt"""
    compiler = Compiler()
    template = compiler.compile(raw_prompt)
    resolved_prompt = template(params)
    return resolved_prompt


def find_dependencies_in_prompt(
    prompt_template: str, current_prompt_name: str, prompt_list: List[Prompt]
) -> Set[str]:
    """
    Finds and returns a set of prompt IDs that are dependencies of the given prompt.

    :param prompt_template: The prompt template string to search for dependencies.
    :param current_prompt_id: The ID of the current prompt being analyzed.
    :param prompt_list: A list of all prompts in the configuration.

    :return: A set of prompt IDs that are dependencies of the current prompt.
    """
    # This will contain the parameters referenced, as well as their specific sub-properties
    # This technically would disallow parameters from being named the same as prompt inputs
    parameters_in_template = get_parameters_in_template(prompt_template)
    parameter_names = set(parameters_in_template.keys())

    dependencies = set()
    for i, prompt in enumerate(prompt_list):
        # Stop searching for dependencies once the current prompt is reached
        if prompt.name == current_prompt_name:
            break

        # Skip prompts without names as they cannot be referenced
        if not prompt.name:
            continue
        # technically, if referencing another cell's input, that cell isn't an execution dependency; but we'll keep it simple for now
        if prompt.name in parameter_names:
            dependencies.add(prompt.name)

    # Exclude references to prompts ahead of the current prompt
    # because including them could result in cyclic dependencies
    return dependencies


def get_dependency_graph(
    root_prompt: Prompt, all_prompts: List[Prompt], prompt_dict: Dict[str, Prompt]
) -> dict[str, List[str]]:
    """
    Generates an upstream dependency graph of prompts in the configuration, with each entry representing only its direct dependencies.
    Traversal is required to identify all upstream dependencies. The specified prompt serves as the root.

    :param root_prompt: The starting point for generating the dependency graph.
    :param all_prompts: A list of all prompts in the configuration.
    :param prompt_dict: A dictionary mapping prompt names to prompt objects.
    :return: A dependency graph represented as a dictionary.
    """
    visited = set()
    dependency_graph = defaultdict(list)

    def build_dependency_graph_recursive(current_prompt_name: str) -> dict:
        """
        Recursively constructs the dependency graph for a given prompt.

        :param current_prompt_name: The name of the current prompt being processed.
        """
        if current_prompt_name in visited:
            return
        visited.add(current_prompt_name)

        prompt_template = prompt_dict[current_prompt_name].get_raw_prompt_from_config()
        prompt_dependencies = find_dependencies_in_prompt(
            prompt_template, current_prompt_name, all_prompts
        )

        for prompt_dependency in prompt_dependencies:
            dependency_graph[current_prompt_name].append(prompt_dependency)
            build_dependency_graph_recursive(prompt_dependency)

    build_dependency_graph_recursive(root_prompt.name)
    return dependency_graph


def resolve_parameters(params, prompt: Prompt, ai_config: "AIConfig"):
    """
    Resolves input parameters for a specific prompt in the AI Configuration.

    Args:
        params (dict): A dictionary of parameters to substitute into the prompt.
        prompt (Prompt): The prompt to be resolved.
        ai_config (AIConfig): The AIConfig object containing all prompts and parameters.

    Returns:
        dict: Returns resolved prompt for constructing completion params, or for inference.
    """

    resolved_prompt = resolve_prompt(prompt, params, ai_config)
    return resolved_prompt


def get_prompt_template(prompt: Prompt, aiconfig: "AIConfigRuntime"):
    """
    Returns the template for a prompt.

    Args:
        prompt (Prompt): The prompt to be resolved.
        ai_config (AIConfig): The AIConfig object containing all prompts and parameters.

    Returns:
        str: Returns the template for a prompt.
    """
    model_parser = ModelParserRegistry.get_model_parser_for_prompt(prompt, aiconfig)
    # Circular type reference
    from ..default_parsers.parameterized_model_parser import ParameterizedModelParser
    if isinstance(model_parser, ParameterizedModelParser):
        return model_parser.get_prompt_template(prompt, aiconfig)

    if isinstance(prompt.input, str):
        return prompt.input
    elif isinstance(prompt.input.data, str):
        return prompt.input.data
    else:
        raise Exception(f"Cannot get prompt template string from prompt: {prompt.input}")


def collect_prompt_references(current_prompt: Prompt, ai_config: "AIConfigRuntime"):
    """
    Collects references to all other prompts in the AIConfig. Only prompts that appear before the current prompt are collected.
    """
    prompt_references = {}
    for previous_prompt in ai_config.prompts:
        if current_prompt.name == previous_prompt.name:
            break

        prompt_input = get_prompt_template(previous_prompt, ai_config)
        prompt_output = (
            ai_config.get_output_text(
                previous_prompt, ai_config.get_latest_output(previous_prompt)
            )
            if previous_prompt.outputs
            else None
        )
        prompt_references[previous_prompt.name] = {
            "input": prompt_input,
            "output": prompt_output,
        }
    return prompt_references


def resolve_prompt(
    current_prompt: Prompt, input_params: Dict, ai_config: "AIConfigRuntime"
) -> str:
    """
    Parameterizes a prompt using provided parameters, references to other prompts, and parameters stored in config..
    """
    raw_prompt = get_prompt_template(current_prompt, ai_config)

    return resolve_prompt_string(current_prompt, input_params, ai_config, raw_prompt)


def resolve_system_prompt(
    current_prompt: Prompt, system_prompt: str, input_params: Dict, ai_config: "AIConfigRuntime"
) -> str:
    """
    Parameterizes a system prompt using provided prompt and parameters, references to other prompts, and parameters stored in config..
    """
    return resolve_prompt_string(current_prompt, input_params, ai_config, system_prompt)


def resolve_prompt_string(
    current_prompt: Prompt, input_params: Dict, ai_config: "AIConfigRuntime", prompt_string: str
) -> str:
    """
    Parameterizes a prompt using provided parameters, references to other prompts, and parameters stored in config..

    Args:
        current_prompt (Prompt): The prompt to be parameterized.
        input_params (dict): A dictionary of parameters to substitute into the prompt.
        ai_config (AIConfig): The AIConfig object containing all prompts and parameters.

    Returns:
        str: The parameterized prompt with placeholders replaced by values.
    """

    # augment params with prompt-reference params
    augmented_params = collect_prompt_references(current_prompt, ai_config)

    # augment params with config-level params
    augmented_params.update(ai_config.metadata.parameters)

    # augment params with prompt level params
    augmented_params.update(ai_config.get_prompt_parameters(current_prompt))

    # Combine input_params and augmented_params
    combined_params = dict(augmented_params, **input_params)

    return resolve_parametrized_prompt(prompt_string, combined_params)
