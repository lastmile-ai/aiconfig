import asyncio
import logging
import sys

import lastmile_utils.lib.core.api as core_utils
import result
from aiconfig.Config import AIConfigRuntime
from aiconfig.eval.lib import TextBasedInputDatum, run_aiconfig_on_text_based_input
from result import Result

logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)


class Settings(core_utils.Record):
    prompt_name: str
    aiconfig_path: str


@core_utils.exception_to_err_with_traceback
def _load_aiconfig(settings: Settings):
    return AIConfigRuntime.load(settings.aiconfig_path)


async def main():
    settings_path = sys.argv[1]
    res_settings = _load_settings(settings_path)

    question = sys.argv[2]

    final_value = await result.do_async(
        await run_aiconfig_on_text_based_input(
            #
            runtime=aiconfig_ok,
            prompt_name=settings_ok.prompt_name,
            params=TextBasedInputDatum(question),
        )
        for settings_ok in res_settings
        for aiconfig_ok in _load_aiconfig(settings_ok)
    )

    print(final_value.unwrap_or_else(str))

    LOGGER.info("Final value: %s", final_value)


def _load_settings(settings_path: str) -> Result[Settings, str]:
    return core_utils.pydantic_model_validate_from_json_file_path(settings_path, Settings)


if __name__ == "__main__":
    asyncio.run(main())
