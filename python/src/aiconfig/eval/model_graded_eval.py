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


def get_llm_structured_response(
    input_text: str,
    chat_completion_create: CompletionTextToSerializedJSON,
    basemodel_type: Type[common.T_BaseModel],
) -> Result[common.T_BaseModel, str]:
    return result.do(
        cu.safe_model_validate_json(response_ok, basemodel_type)
        # get the serialized JSON response
        for response_ok in chat_completion_create(input_text)
    )
