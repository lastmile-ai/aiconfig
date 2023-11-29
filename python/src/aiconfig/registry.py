import typing
from typing import Dict, List

from aiconfig.schema import Prompt

from .model_parser import ModelParser

if typing.TYPE_CHECKING:
    from aiconfig.Config import AIConfigRuntime


class ModelParserRegistry:
    """
    A dictionary to store registered model parsers by their IDs. It stores both:
        1) model_name --> model_parser (ex: "mistralai/Mistral-7B-v0.1" --> 
            HuggingFaceTextGenerationTransformer)
        2) moder_parser.id() --> model_parser (ex: HuggingFaceTextGenerationTransformer 
            works with many different Text Generation models) so is saved as 
            HuggingFaceTextGenerationTransformer.id() (str) (usually it's classname) --> 
            HuggingFaceTextGenerationTransformer (obj) 
        
    The reason we allow 2) above is so that you can define the relationship between a 
    model name and a model parser in the AIConfig instead of the model parser class (ex:
    https://github.com/lastmile-ai/aiconfig/blob/main/cookbooks/HuggingFace/Mistral-aiconfig.json#L16-L18).
    This then gets updated into the desired format 1) by calling the 
    `update_model_parser_registry_with_config_runtime()` command
    Each model_name is only allowed to map to a single model_parser for an AIConfigRuntime.
    """
    _parsers: Dict[str, ModelParser] = {}

    @staticmethod
    def register_model_parser(model_parser: ModelParser, model_names: List[str] = None):
        """
        Adds a model parser to the registry. This model parser is used to parse Prompts in the AIConfig that use the given model.
        Args:
            model_parser (ModelParser): The model parser to add to the registry.
            model_names (list, optional): Optional list of model names to map to the 
                model parser. If unspecified, the model parser will be resgistered under its own ID.
        """
        if model_names:
            for model_name in model_names:
                ModelParserRegistry._parsers[model_name] = model_parser
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
        return {
            model_name: model_parser.id()
            for model_name, model_parser in ModelParserRegistry._parsers.items()
        }


def update_model_parser_registry_with_config_runtime(config_runtime: "AIConfigRuntime"):
    """
    Updates the model parser registry with any model parsers specified in the AIConfig.

    Args:
        config_runtime (AIConfigRuntime): The AIConfigRuntime.
    """
    if not config_runtime.metadata.model_parsers:
        return
    for model_id, model_parser_id in config_runtime.metadata.model_parsers.items():
        retrieved_model_parser = ModelParserRegistry.get_model_parser(
            model_parser_id
        )  # Fix
        if retrieved_model_parser is None:
            error_message = (
                f"Unable to load AIConfig: It specifies {config_runtime.metadata.model_parsers}, "
                f"but ModelParser {model_parser_id} for {model_id} does not exist. "
                "Make sure you have registered the ModelParser using AIConfigRuntime.registerModelParser "
                "before loading the AIConfig."
            )
            raise Exception(error_message)

        ModelParserRegistry.register_model_parser(retrieved_model_parser, [model_id])
