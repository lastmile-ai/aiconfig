import json
from typing import Any, List

from aiconfig.Config import AIConfigRuntime
from aiconfig.default_parsers.parameterized_model_parser import ParameterizedModelParser
from aiconfig.model_parser import InferenceOptions
from aiconfig.schema import (
    ExecuteResult,
    OutputDataWithValue,
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
    ) -> List[Prompt]:
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
    ) -> List[Output]:
        resolved = await self.deserialize(prompt, aiconfig, parameters)
        model_input = resolved["model_input"]
        result = await self._run_inference_helper(model_input, options)

        self.qa.append((model_input, result.data[0]))

        return [result]

    async def _run_inference_helper(self, model_input, options) -> List[Output]:
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
            return ExecuteResult(
                output_type="execute_result",
                data=acc,
                metadata={}
            )
        else:
            response = llm(model_input)
            try:
                texts = [r["choices"][0]["text"] for r in response]
            except TypeError:
                texts = [response["choices"][0]["text"]]

            return ExecuteResult(
                output_type="execute_result",
                # TODO: Map all text responses to multiple outputs
                # This would be part of a large refactor: 
                # https://github.com/lastmile-ai/aiconfig/issues/630
                data="\n".join(texts),
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
            output_data = output.data
            if isinstance(output_data, str):
                return output_data
            if isinstance(output_data, OutputDataWithValue):
                if isinstance(output_data.value, str):
                    return output_data.value
                # llama model parser does not support function
                # calls so shouldn't get here, but just being safe
                return json.dumps(output_data.value, indent=2)

            # Doing this to be backwards-compatible with old output format
            # where we used to save a list in output.data
            # See https://github.com/lastmile-ai/aiconfig/issues/630
            if isinstance(output_data, list):
                # TODO: This is an error since list is not compatible with str type
                return output_data
            return ""
        raise ValueError(f"Output is an unexpected output type: {type(output)}")
