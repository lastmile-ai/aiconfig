"""
    Use this file to register model parsers that don't ship with aiconfig.
    - Make sure your package is installed in the same environment as aiconfig.
    - You must define a function `register_model_parsers() -> None` in this file.
    - You should call `AIConfigRuntime.register_model_parser` in that function.

    See example below.
"""

from aiconfig_extension_groq import GroqOpenAIParser
from aiconfig import ModelParserRegistry
import dotenv


def register_model_parsers() -> None:
    groq_mixtral = GroqOpenAIParser(deployment="mixtral-8x7b-32768")
    ModelParserRegistry.register_model_parser(groq_mixtral)
    print(f"{groq_mixtral.id()=}")
    dotenv.load_dotenv()
