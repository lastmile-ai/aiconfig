from typing import Dict, List

from aiconfig.AIConfigSettings import Prompt
from .model_parser import ModelParser


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
        else:
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
    def get_model_parser_for_prompt(prompt: Prompt):
        """
        Retrieves a model parser from the ModelParserRegistry using the prompt's metadata.

        Args:
            prompt (Prompt): The prompt to retrieve the model parser for

        Returns:
            ModelParser: The retrieved model parser
        """
        model_name = prompt.get_model_name()
        return ModelParserRegistry._parsers[model_name]

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
        return {
            model_name: model_parser.id()
            for model_name, model_parser in ModelParserRegistry._parsers.items()
        }
