from typing import Any

from aiconfig.Config import AIConfigRuntime
from aiconfig.model_parser import InferenceOptions


class MockAIConfigRuntime(AIConfigRuntime):
    def __init__(self):
        pass

    async def run_and_get_output_text(
        self,
        prompt_name: str,
        params: dict[Any, Any] | None = None,
        options: InferenceOptions | None = None,
        **kwargs,  # type: ignore
    ) -> str:
        """
        This overrides the real method for mocking, but the output doesn't matter very much.
        We're currently not really testing properties of the output.
        We just have to return a string so the tests work.

        Real method: https://github.com/lastmile-ai/aiconfig/blob/a4376d1f951e19776633d397a3cda7fa85506eef/python/src/aiconfig/Config.py#L277
        """
        params_ = params or {}
        assert params_.keys() == {"the_query"}, 'For eval, AIConfig params must have just the key "the_query".'
        the_query = params_["the_query"]
        return f"output_for_{prompt_name}_the_query_{the_query}"
