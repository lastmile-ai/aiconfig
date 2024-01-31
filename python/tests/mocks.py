from abc import abstractmethod
from typing import Any, Protocol

from aiconfig.Config import AIConfigRuntime
from aiconfig.model_parser import InferenceOptions


class MockRunTextToText(Protocol):
    @abstractmethod
    async def __call__(self, prompt_name: str, params: dict[str, str]) -> str:
        pass


def make_mock_aiconfig_runtime(
    mock_run_text_to_text: MockRunTextToText | None = None,
) -> AIConfigRuntime:
    async def _default_mock_run_text_to_text(
        prompt_name: str, params: dict[str, str]
    ) -> str:
        return f"output_for_{prompt_name}_the_query_{params['the_query']}"

    mock_run_text_to_text_impl = (
        _default_mock_run_text_to_text
        if mock_run_text_to_text is None
        else mock_run_text_to_text
    )

    class _MockAIConfigRuntime(AIConfigRuntime):
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
            return await mock_run_text_to_text_impl(prompt_name, params_)

    return _MockAIConfigRuntime()


MockAIConfigRuntime = lambda: make_mock_aiconfig_runtime()
