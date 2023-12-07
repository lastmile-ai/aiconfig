import asyncio
import logging
import sys
from typing import IO

from result import Ok, Result


from aiconfig.Config import AIConfigRuntime
from aiconfig.eval.lib import run_aiconfig_helper
import lastmile_utils.lib.core.api as cu

logging.basicConfig(format=cu.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)


class Settings(cu.Record):
    prompt_name: str
    aiconfig_path: str


async def main():
    settings_path = sys.argv[1]
    res_settings = _load_settings(settings_path)

    question = sys.argv[2]
    # prompt_name = settings.prompt_name
    # aiconfig_path = settings.aiconfig_path

    def _load_aiconfig(settings: Settings) -> Result[AIConfigRuntime, str]:
        try:
            return Ok(AIConfigRuntime.load(settings.aiconfig_path))  # type: ignore[no-untyped-call]
        except ValueError as e:
            return cu.ErrWithTraceback(e)

    # TODO: Need do_async for a different reason: the async expression can't be defined
    # before the do because it's a function of the stuff unwrapped in the do.
    settings = res_settings.unwrap()
    res_aiconfig = _load_aiconfig(settings)
    aiconfig = res_aiconfig.unwrap()
    final_value = await run_aiconfig_helper(
        runtime=aiconfig, prompt_name=settings.prompt_name, question=question
    )

    print(final_value.unwrap_or_else(str))

    LOGGER.info("Final value: %s", final_value)


def _load_settings(settings_path: str) -> Result[Settings, str]:
    def pydantic_model_validate_from_json_file_handle(
        f_handle: IO[str],
    ) -> Result[Settings, str]:
        def settings_model_validate_json(s: str) -> Result[Settings, str]:
            try:
                return Ok(Settings.model_validate_json(s))
            except ValueError as e:
                return cu.ErrWithTraceback(e)

        return cu.read_file_from_handle(f_handle).and_then(settings_model_validate_json)

    path_fn = cu.safe_file_io_decorator(
        pydantic_model_validate_from_json_file_handle, mode="r"
    )
    return path_fn(settings_path)


if __name__ == "__main__":
    asyncio.run(main())
