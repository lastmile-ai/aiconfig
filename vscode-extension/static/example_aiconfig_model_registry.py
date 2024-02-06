"""
    Use this file to register model parsers that don't ship with aiconfig.
    - Make sure your package is installed in the same environment as aiconfig.
    - You must define a function `register_model_parsers() -> None` in this file.
    - You should call `AIConfigRuntime.register_model_parser` in that function.

    See example below.
"""


# from aiconfig import AIConfigRuntime
# from llama import LlamaModelParser


def register_model_parsers() -> None:
    # Example:
    # model_path = "/path/to/my/local/llama/model"
    # llama_model_parser = LlamaModelParser(model_path)
    # AIConfigRuntime.register_model_parser(llama_model_parser, "llama-2-7b-chat")
    # You can remove this `pass` once your function is implemented (see above).
    pass
