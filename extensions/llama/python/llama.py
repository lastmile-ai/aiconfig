from typing import Any

from aiconfig.Config import AIConfigRuntime
from aiconfig.default_parsers.parameterized_model_parser import ParameterizedModelParser
from aiconfig.model_parser import InferenceOptions
from aiconfig.schema import (
    ExecuteResult,
    OutputData,
    Output,
    Prompt,
)
from aiconfig.util.params import resolve_prompt
from llama_cpp import Llama


class LlamaModelParser(ParameterizedModelParser):
    def __init__(self, model_path: str) -> None:
        super().__init__()
        self.model_path = model_path
        self.qa = []

    async def serialize(
        self,
        prompt_name: str,
        data: Any,
        ai_config: AIConfigRuntime,
        parameters: dict | None = None,
        **kwargs,
    ) -> Prompt:
        parameters = parameters or {}
        out = Prompt(name=prompt_name, input=data)
        return [out]

    async def deserialize(
        self, prompt: Prompt, aiconfig: AIConfigRuntime, params: dict | None = None
    ) -> dict:
        resolved = resolve_prompt(prompt, params, aiconfig)

        try:
            remember_chat_context = prompt.metadata.remember_chat_context
        except AttributeError:
            remember_chat_context = False

        model_input = (
            f"CONTEXT:\n{self.history()}\nQUESTION:\n{resolved}"
            if remember_chat_context
            else resolved
        )
        return {"model_input": model_input}

    def id(self) -> str:
        return "LLaMA"

    def history(self) -> str:
        def _fmt(q, a):
            return f"Q: {q}\nA: {a}"

        out = "\n".join(_fmt(q, a) for q, a in self.qa)
        return out

    async def run_inference(
        self,
        prompt: Prompt,
        aiconfig: AIConfigRuntime,
        options: InferenceOptions | None,
        parameters: dict,
    ) -> ExecuteResult:
        resolved = await self.deserialize(prompt, aiconfig, parameters)
        model_input = resolved["model_input"]
        result = await self._run_inference_helper(model_input, options)

        self.qa.append((model_input, result.data[0]))

        return result

    async def _run_inference_helper(self, model_input, options) -> ExecuteResult:
        llm = Llama(self.model_path)
        acc = ""
        stream = options.stream if options else True
        if stream:
            for res in llm(model_input, stream=True):
                raw_data = res["choices"][0]
                data = raw_data["text"]
                index = int(raw_data["index"])
                acc += data
                if options:
                    options.stream_callback(data, acc, index)
            print(flush=True)

            output_data_value : str = ''
            if isinstance(acc, str):
                output_data_value = acc
            else:
                raise ValueError(f"Output {acc} needs to be of type 'str' but is of type: {type(acc)}")
            return ExecuteResult(
                output_type="execute_result",
                data=OutputData(kind="string", value=output_data_value),
                metadata={}
            )
        else:
            response = llm(model_input)
            try:
                texts = [r["choices"][0]["text"] for r in response]
            except TypeError:
                texts = [response["choices"][0]["text"]]

            output_data_value : str = ''
            if isinstance(texts[0], str):
                output_data_value = texts[0]
            else:
                raise ValueError(f"Output {texts[0]} needs to be of type 'str' but is of type: {type(texts[0])}")
            return ExecuteResult(
                output_type="execute_result",
                data=OutputData(kind="string", value=output_data_value),
                metadata={}
            )

    def get_output_text(
        self, prompt: Prompt, aiconfig: AIConfigRuntime, output: Output | None = None
    ) -> str:
        if not output:
            output = aiconfig.get_latest_output(prompt)

        if not output:
            return ""

        if output.output_type == "execute_result":
            if isinstance(output.data, OutputData):
                return output.data.value
            elif isinstance(output.data, str):
                return output.data
        raise ValueError(f"Output is an unexpected output type: {type(output)}")
