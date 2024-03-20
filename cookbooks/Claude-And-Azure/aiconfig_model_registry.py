"""
    Use this file to register model parsers that don't ship with aiconfig.
    - Make sure your package is installed in the same environment as aiconfig.
    - You must define a function `register_model_parsers() -> None` in this file.
    - You should call `AIConfigRuntime.register_model_parser` in that function.

    See example below.
"""

from aiconfig import AzureOpenAIParser, ModelParserRegistry
import dotenv


def register_model_parsers() -> None:
    azure_gpt_35 = AzureOpenAIParser(deployment="gpt-35-turbo")
    ModelParserRegistry.register_model_parser(azure_gpt_35)

    dotenv.load_dotenv()
