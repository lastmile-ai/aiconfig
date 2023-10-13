import copy
from aiconfig_tools.AIConfigSettings import Prompt
from aiconfig_tools.model_parser import ModelParser
from aiconfig_tools.registry import ModelParserRegistry
import pytest


class MockModelParser(ModelParser):
    def __init__(self):
        pass

    def id(self):
        return "mock_model_parser"

    def serialize(**kwargs):
        return

    def deserialize(**kwargs):
        return

    def run(**kwargs):
        return
    def get_output_text():
        return


class TestModelParserRegistry:

    """
    ModelParserRegistry is a static class with static variables. Setup and Teardown methods ensure that the static variable _parsers is restored to its original value after these tests. Isolates the tests from others.
    """

    @classmethod
    def setup_class(cls):
        # Store the original value of static_variable
        cls.original_static_variable = copy.deepcopy(ModelParserRegistry._parsers)

    @classmethod
    def teardown_class(cls):
        # Restore the original value of static_variable after testing
        ModelParserRegistry._parsers = cls.original_static_variable

    def test_register_multiple_ids_to_one_parser(self):
        mock_model_parser = MockModelParser()
        ModelParserRegistry.register_model_parser(mock_model_parser, ["id1", "id2"])

        assert ModelParserRegistry.get_model_parser("id1") == mock_model_parser
        assert ModelParserRegistry.get_model_parser("id2") == mock_model_parser

    def test_register_single_model_parser(self):
        mock_model_parser = MockModelParser()
        ModelParserRegistry.register_model_parser(mock_model_parser)

        assert ModelParserRegistry.get_model_parser(mock_model_parser.id()) == mock_model_parser

    def test_register_multiple_model_parsers_with_different_ids(self):
        # Create model parsers
        model_parser_1 = MockModelParser()
        model_parser_2 = MockModelParser()

        # Register the model parsers with different IDs
        ModelParserRegistry.register_model_parser(model_parser_1, ids=["model-4"])
        ModelParserRegistry.register_model_parser(model_parser_2, ids=["model-5"])

        # Assert that each model parser is registered under its respective ID
        assert ModelParserRegistry.get_model_parser("model-4") == model_parser_1
        assert ModelParserRegistry.get_model_parser("model-5") == model_parser_2

    def test_retrieve_model_parser(self):
        # Create a model parser
        model_parser = MockModelParser()

        # Register the model parser
        ModelParserRegistry.register_model_parser(model_parser, ids=["model-6"])

        # Retrieve the model parser using its ID
        retrieved_parser = ModelParserRegistry.get_model_parser("model-6")

        # Assert that the retrieved model parser is the same as the registered one
        assert retrieved_parser == model_parser

    def test_retrieve_nonexistent_model_parser(self):
        # Attempt to retrieve a model parser that is not registered
        with pytest.raises(KeyError):
            ModelParserRegistry.get_model_parser("nonexistent-model")

    def test_retrieve_model_parser_for_prompt(self):
        # Create a model parser
        model_parser = MockModelParser()

        # Register the model parser with a specific model name
        ModelParserRegistry.register_model_parser(model_parser, ids=["model-7"])

        # Create a Prompt object with the registered model name
        prompt = Prompt(
            **{
                "name": "prompt1",
                "input": "I am the prompt's input",
                "metadata": {"model": "model-7"},
            }
        )

        # Retrieve the model parser for the Prompt
        retrieved_parser = ModelParserRegistry.get_model_parser_for_prompt(prompt)

        # Assert that the retrieved model parser is the same as the registered one
        assert retrieved_parser == model_parser

    def test_retrieve_model_parser_for_prompt_with_nonexistent_model(self):
        # Create a Prompt object with a model name that is not registered
        prompt = Prompt(
            **{
                "name": "prompt1",
                "input": "I am the prompt's input",
                "metadata": {"model": "test_model"},
            }
        )

        # Attempt to retrieve a model parser for the Prompt
        with pytest.raises(KeyError):
            print(ModelParserRegistry.get_model_parser_for_prompt(prompt).id())

    def test_remove_model_parser(self):
        # Create a model parser
        model_parser = MockModelParser()

        # Register the model parser
        ModelParserRegistry.register_model_parser(model_parser, ids=["model-8"])
        assert ModelParserRegistry.get_model_parser("model-8") == model_parser

        # Remove the registered model parser
        ModelParserRegistry.remove_model_parser("model-8")

        # Attempt to retrieve the removed model parser
        with pytest.raises(KeyError):
            parser = ModelParserRegistry.get_model_parser("model-8") == None

    def test_clear_registry(self):
        # Create model parsers
        model_parser_1 = MockModelParser()
        model_parser_2 = MockModelParser()

        # Register the model parsers
        ModelParserRegistry.register_model_parser(model_parser_1, ids=["model-9"])
        ModelParserRegistry.register_model_parser(model_parser_2, ids=["model-10"])

        # Clear the registry
        ModelParserRegistry.clear_registry()

        # Attempt to retrieve the model parsers from the cleared registry
        assert len(ModelParserRegistry.parser_ids()) == 0
