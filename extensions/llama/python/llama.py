from typing import Any
from aiconfig import Output, Prompt
from aiconfig.Config import AIConfigRuntime
from aiconfig.default_parsers.parameterized_model_parser import ParameterizedModelParser
from aiconfig.model_parser import InferenceOptions
from aiconfig.schema import ExecuteResult

from llama_cpp import CreateCompletionResponse, Llama

from aiconfig.util.params import resolve_prompt


SUPPORTED_MODELS = ["llama-2-7b-chat"]


class LlamaModelParser(ParameterizedModelParser):
    def __init__(self, model_path: str) -> None:
        super().__init__()
        self.model_path = model_path

    async def serialize(
        self,
        prompt_name: str,
        data: Any,
        ai_config: AIConfigRuntime,
        parameters: dict | None = None,
        **kwargs,
    ) -> Prompt:
        parameters = parameters or {}
        out = Prompt(name="TODO", input="TODO")
        return out

    async def deserialize(
        self, prompt: Prompt, aiconfig: AIConfigRuntime, params: dict | None = None
    ) -> dict:
        out = {}
        return out

    def id(self) -> str:
        return "LLaMA"

    async def run_inference(
        self,
        prompt: Prompt,
        aiconfig: AIConfigRuntime,
        options: InferenceOptions | None,
        parameters: dict,
    ) -> ExecuteResult:
        resolved = resolve_prompt(prompt, parameters, aiconfig)

        llm = Llama(self.model_path)
        response = llm(resolved)

        try:
            texts = [r["choices"][0]["text"] for r in response]
        except TypeError:
            texts = [response["choices"][0]["text"]]

        return ExecuteResult(output_type="execute_result", data=texts, metadata={})

    def get_output_text(
        self, prompt: Prompt, aiconfig: AIConfigRuntime, output: Output | None = None
    ) -> str:
        match output:
            case ExecuteResult(data=d):
                return d
            case _:
                raise ValueError(f"Unexpected output type: {type(output)}")
