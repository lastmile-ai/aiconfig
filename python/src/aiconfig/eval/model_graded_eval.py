from abc import abstractmethod
from typing import Protocol, Type

import lastmile_utils.lib.core.api as cu
import result
from aiconfig.eval import common
from result import Result


class CompletionTextToSerializedJSON(Protocol):
    @abstractmethod
    def __call__(self, output_datum: str) -> Result[common.SerializedJSON, str]:
        pass


def _get_json_response_from_schema(
    input_text: str,
    chat_completion_create: CompletionTextToSerializedJSON,
    properties: dict[str, dict[str, str]],
    required: list[str] = [],
    descriptions: dict[str, str] = {},
) -> Result[common.SerializedJSON, str]:
    """
    properties: like {
        "conciseness_confidence": {"type": "number", "description": "0 to 1.0 rating of confidence in conciseness rating"},
        "conciseness_reasoning": {"type": "string", "title": "reasoning behind the conciseness rating"},
    }
    required: like ["conciseness_confidence", "conciseness_reasoning"]

    descriptions: like {"conciseness_confidence": "0 to 1.0 rating of confidence in conciseness rating"}

    out: JSON-serialized like '{"conciseness_confidence": 0.9, "conciseness_reasoning": "I think it's pretty concise."}'
    """

    def _with_description(key: str, value: dict[str, str]) -> dict[str, str]:
        if key in descriptions:
            return cu.dict_union_allow_replace(value, {"description": descriptions[key]})
        return value

    properties = {k: _with_description(k, v) for k, v in properties.items()}

    try:
        required = required or list(properties.keys())
        return chat_completion_create(input_text)
    except Exception as e:
        return cu.ErrWithTraceback(e)


def get_llm_structured_response(
    input_text: str,
    chat_completion_create: CompletionTextToSerializedJSON,
    basemodel_type: Type[common.T_BaseModel],
    descriptions: dict[str, str] = {},
) -> Result[common.T_BaseModel, str]:
    """
    model example: "gpt-3.5-turbo-0613"
    basemodel_type: a pydantic basemodel class (not instance)
    """

    schema = basemodel_type.model_json_schema()
    properties = schema["properties"]
    required = schema["required"]
    response = _get_json_response_from_schema(input_text, chat_completion_create, properties, required, descriptions)

    return result.do(cu.safe_model_validate_json(response_ok, basemodel_type) for response_ok in response)
