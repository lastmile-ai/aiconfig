import typing
from typing import Dict, List

from aiconfig.schema import Prompt

from .model_parser import ModelParser

if typing.TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime


class ModelParserRegistry:
    # A dictionary to store registered model parsers by their IDs
    _parsers: Dict[str, ModelParser] = {}

    @staticmethod
    def register_model_parser(model_parser: ModelParser, ids: List[str] = None):
        """
        Adds a model parser to the registry. This model parser is used to parse Prompts in the AIConfig that use the given model.

        Args:
            model_parser (ModelParser): The model parser to add to the registry.
            ids (list, optional): Optional list of IDs to register the model parser under. If unspecified, the model parser will be resgistered under its own ID.
        """
        if ids:
            for id in ids:
                ModelParserRegistry._parsers[id] = model_parser
        ModelParserRegistry._parsers[model_parser.id()] = model_parser

    @staticmethod
    def get_model_parser(model_id: str) -> ModelParser:
        """
        Retrieves a model parser from the ModelParserRegistry.

        Args:
            model_id (str): The ID of the model parser to retrieve

        Returns:
            ModelParser: The retrieved model parser
        """
        return ModelParserRegistry._parsers[model_id]

    @staticmethod
    def get_model_parser_for_prompt(prompt: Prompt, config: "AIConfigRuntime"):
        """
        Retrieves a model parser from the ModelParserRegistry using the prompt's metadata.

        Args:
            prompt (Prompt): The prompt to retrieve the model parser for

        Returns:
            ModelParser: The retrieved model parser
        """
        model_name = config.get_model_name(prompt)
        return ModelParserRegistry.get_model_parser(model_name)

    @staticmethod
    def remove_model_parser(id: str):
        """
        Removes a model parser from the ModelParserRegistry.

        Args:
            id (str): The ID of the model parser to remove

        """
        ModelParserRegistry._parsers.pop(id)

    @staticmethod
    def clear_registry():
        """
        Removes all model parsers from the Registry.
        """
        ModelParserRegistry._parsers.clear()

    @staticmethod
    def parser_ids() -> list:
        """
        Retrieves a list of model parser IDs from the ModelParserRegistry.

        Returns:
            list: A list of model parser IDs.
        """
        return list(ModelParserRegistry._parsers.keys())

    @staticmethod
    def display_parsers() -> Dict[str, str]:
        """
        returns a dictionary of model names and their correspondings model parser ids
        """
        return {model_name: model_parser.id() for model_name, model_parser in ModelParserRegistry._parsers.items()}


def update_model_parser_registry_with_config_runtime(config_runtime: "AIConfigRuntime"):
    """
    Updates the model parser registry with any model parsers specified in the AIConfig.

    Args:
        config_runtime (AIConfigRuntime): The AIConfigRuntime.
    """
    if not config_runtime.metadata.model_parsers:
        return
    for model_id, model_parser_id in config_runtime.metadata.model_parsers.items():
        retrieved_model_parser = ModelParserRegistry.get_model_parser(model_parser_id)  # Fix
        if retrieved_model_parser is None:
            error_message = (
                f"Unable to load AIConfig: It specifies {config_runtime.metadata.model_parsers}, "
                f"but ModelParser {model_parser_id} for {model_id} does not exist. "
                "Make sure you have registered the ModelParser using AIConfigRuntime.registerModelParser "
                "before loading the AIConfig."
            )
            raise Exception(error_message)

        ModelParserRegistry.register_model_parser(retrieved_model_parser, [model_id])
