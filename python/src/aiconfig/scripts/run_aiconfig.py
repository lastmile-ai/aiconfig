import asyncio
import logging
import sys

from result import Ok, Result


from aiconfig.Config import AIConfigRuntime
from aiconfig.eval.lib import run_aiconfig_helper
import lastmile_utils.lib.core.api as core_utils

logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)


class Settings(core_utils.Record):
    prompt_name: str
    aiconfig_path: str


async def main():
    settings_path = sys.argv[1]
    res_settings = _load_settings(settings_path)

    question = sys.argv[2]

    def _load_aiconfig(settings: Settings) -> Result[AIConfigRuntime, str]:
        try:
            return Ok(AIConfigRuntime.load(settings.aiconfig_path))  # type: ignore[no-untyped-call]
        except ValueError as e:
            return core_utils.ErrWithTraceback(e)

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
    return core_utils.pydantic_model_validate_from_json_file_path(settings_path, Settings)


if __name__ == "__main__":
    asyncio.run(main())
