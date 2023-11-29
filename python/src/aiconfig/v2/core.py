"""
Proposal for new core AIConfig data model

Summary:
1. AIConfig is a system consisting of 
a data model, a JSON-backed format, a run API, and a builder API
2. An AIConfig instance is nothing but a collection of instances of the data. 
A graph naturally emerges from an instance.
3. model-provider specific stuff (model parsers) is completely decoupled from the rest of the logic
4. The run and builder APIs can seamlessly interop, allowing arbitrarily modifying AIC instances

LIMITATIONS:
* Text only for now
"""

from abc import ABC, abstractmethod
from functools import partial
import inspect
from typing import Any, Callable, Literal, NewType

import lastmile_utils.lib.core.api as cu
from pydantic import BaseModel, ConfigDict
from result import Err, Ok, Result

from aiconfig.Config import AIConfigRuntime as AIConfigRuntimeV1


Text = NewType("Text", str)


class Image(cu.Record):
    pass


ExecuteInput = NewType("ExecuteInput", Text)

# This will be a Union type eventually
Data = Text | Image

# TODO type better
# no return, side effects only.
StreamCallback = Callable[[Any, Any, int], None]


class ExecuteResult(cu.Record):
    # Type of output
    output_type: Literal["execute_result"]
    # nth choice.
    execution_count: int | None = None
    # The result of the executing prompt.
    data: Data
    # The MIME type of the result. If not specified, the MIME type will be assumed to be plain text.
    mime_type: str | None = None
    # Output metadata
    metadata: dict[str, Any]

    def get_output_text(self) -> Result[Text, str]:
        match self.data:
            case Text(text):
                return Ok(text)
            case _:
                return Err("Cannot get output text: wrong type")


class NamedTexts(cu.Record):
    mapping: dict[str, Text]

    def union(self, other: "NamedTexts") -> Result["NamedTexts", str]:
        nt_union = cu.dict_union(self.mapping, other.mapping)
        return nt_union.map(
            lambda ntu:  # type: ignore
            # make new one
            NamedTexts(mapping=ntu)
        )

    @property
    def text_names(self) -> set[str]:
        return set(self.mapping.keys())


class TextPromptTemplate(cu.Record):
    """
    conceptually, PromptTemplate is a closure
    that has some of its named inputs bound,
    and returns text which is ready to input directly into a model.
    """

    bound: NamedTexts
    resolve_fn: Callable[[NamedTexts], ExecuteInput]

    @property
    def names(self) -> set[str]:
        return set(inspect.signature(self.resolve_fn).parameters.keys())

    def bind(self, named_texts: NamedTexts) -> Result["TextPromptTemplate", str]:
        """
        Add more named texts to the closure. Sort of like partial application."""
        names_to_bind = named_texts.mapping.keys()
        if not self.names <= names_to_bind:
            return Err(
                f"Cannot bind {self.names - names_to_bind} because they are not in {names_to_bind}"
            )
        nt_union = self.bound.union(named_texts)
        return nt_union.map(
            lambda ntu: TextPromptTemplate(  # type: ignore
                resolve_fn=self.resolve_fn, bound=ntu
            )
        )


class InferenceConfig(cu.Record):
    """Includes stuff that's specific to the model provider."""

    name: str  # e.g. "gpt-4"
    # TBD


class Prompt(cu.Record):
    """Immutable struct representing a runnable node in the model graph.
    Basically it's a closure.

    """

    model_config = ConfigDict(strict=True)

    text_prompt_template: TextPromptTemplate
    inference_config: InferenceConfig
    tags: set[str] = set()


def resolve_text_prompt_template(
    text_prompt_template: TextPromptTemplate,
) -> Result[ExecuteInput, str]:
    """Return the resulting Text if and only all named inputs are bound.
    Otherwise return an error."""
    if text_prompt_template.names != text_prompt_template.bound.text_names:
        return Err(
            f"""Cannot resolve because 
            {text_prompt_template.names - text_prompt_template.bound.text_names} 
            are not bound"""
        )
    else:
        return Ok(text_prompt_template.resolve_fn(text_prompt_template.bound))


class ModelParser(ABC):
    @abstractmethod
    async def run_with_input(
        self,
        execute_input: ExecuteInput,
    ) -> Result[ExecuteResult, str]:
        pass

    async def run_with_prompt_template(
        self,
        text_prompt_template: TextPromptTemplate,
        named_texts: NamedTexts,
    ) -> Result[ExecuteResult, str]:
        async def _run_with_input(
            execute_input: ExecuteInput,
        ) -> Result[ExecuteResult, str]:
            return await self.run_with_input(execute_input)

        res_execute_input = text_prompt_template.bind(named_texts).and_then(
            resolve_text_prompt_template
        )

        res_execute_result = await res_execute_input.and_then_async(_run_with_input)
        return res_execute_result


def runtime_v1_to_aiconfig_v2_adapter(
    aiconfig_runtime_v1: AIConfigRuntimeV1,
) -> Result["AIConfig", str]:
    def _get_prompts_by_name(
        aicv1: AIConfigRuntimeV1,
    ) -> Result[dict[str, Prompt], str]:
        out = {}
        for prompt in aicv1.prompts:
            if prompt.name in out:
                return Err(f"Duplicate prompt name: {prompt.name}")
            out[prompt.name] = Prompt(
                text_prompt_template=TextPromptTemplate(
                    # bound=NamedTexts(mapping={}),
                    # resolve_fn=lambda _: ExecuteInput(prompt.input),
                ),
                inference_config=InferenceConfig(name="gpt-4"),
            )
        return out

    return Ok(
        AIConfig(
            name=aiconfig_runtime_v1.name,
            schema_version="v2",
            description=aiconfig_runtime_v1.description,
            prompts_by_name=_get_prompts_by_name(aiconfig_runtime_v1),
        )
    )


class AIConfig(BaseModel):
    """
    A mutable set of the instances of the data above.
    """

    model_config = ConfigDict(strict=True)

    name: str
    schema_version: Literal["v2"]
    description: str | None = ""
    prompts_by_name: dict[str, Prompt] = {}

    @classmethod
    def load(cls, json_config_filepath: str) -> Result["AIConfig", str]:
        raw_json = cu.read_text_file(json_config_filepath)

        # Use V1 to load from JSON for backwards compatibility
        return raw_json.and_then(
            partial(cu.safe_validate_pydantic_model, cls=AIConfigRuntimeV1)
        ).and_then(runtime_v1_to_aiconfig_v2_adapter)

    # async def run(self, )
