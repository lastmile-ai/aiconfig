from aiconfig import AIConfigRuntime
from aiconfig_extension_llama_guard import LLamaGuardParser
from aiconfig.registry import ModelParserRegistry


def register_model_parsers() -> None:
    llama_model_parser = LLamaGuardParser()
    AIConfigRuntime.register_model_parser(llama_model_parser, llama_model_parser.id())
