import asyncio
import json
import logging
import sys
from typing import Optional, TypeVar, cast

import lastmile_utils.lib.core.api as core_utils
import pandas as pd
import result
from aiconfig.Config import AIConfigRuntime
from aiconfig.callback import CallbackManager
from aiconfig.eval.lib import (
    TextBasedInputDatum,
    run_aiconfig_on_text_based_input,
)
from frozendict import frozendict
from result import Err, Ok, Result

logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)


class Settings(core_utils.Record):
    prompt_name: str
    aiconfig_path: str
    aiconfig_params: Optional[str] = None
    aiconfig_params_path: Optional[str] = None


T = TypeVar("T")


async def main():
    main_parser = core_utils.argparsify(Settings)
    settings: Result[Settings, str] = core_utils.parse_args(main_parser, sys.argv[1:], Settings)

    aiconfig_params_list = settings.and_then(_settings_to_inputs_list)

    final_value = await result.do_async(
        await run_aiconfig_inputs_list(
            settings_ok.aiconfig_path,
            settings_ok.prompt_name,
            aiconfig_params_list_ok,
        )
        for settings_ok in settings
        for aiconfig_params_list_ok in aiconfig_params_list
    )

    print(final_value.unwrap_or_else(str))

    LOGGER.info("Final value: %s", final_value)


@core_utils.exception_to_err_with_traceback
def _load_aiconfig(path: str):
    return AIConfigRuntime.load(path)


def _settings_to_inputs_list(
    settings: Settings,
) -> Result[list[TextBasedInputDatum], str]:
    if settings.aiconfig_params_path is not None and settings.aiconfig_params is not None:
        return Err("Cannot specify both aiconfig_params and aiconfig_params_path.")
    elif settings.aiconfig_params is not None:
        parsed = _parse_params(settings.aiconfig_params)
        return core_utils.result_reduce_list_all_ok([parsed])
    elif settings.aiconfig_params_path is not None:
        try:
            df = pd.read_csv(settings.aiconfig_params_path)  # type: ignore[pandas]
            return df_to_aiconfig_inputs(df)
        except Exception as e:
            return Err(f"Could not convert CSV at {settings.aiconfig_params_path}, {e}.")
    else:
        return Err("Must specify either aiconfig_params or aiconfig_params_path.")


def df_to_aiconfig_inputs(
    df: pd.DataFrame,
) -> Result[list[TextBasedInputDatum], str]:
    try:
        if len(df.columns) == 1:
            parsed = df[df.columns[0]].apply(_parse_params)  # type: ignore[pandas]
            parsed_list = cast(list[Result[TextBasedInputDatum, str]], parsed)
            return core_utils.result_reduce_list_all_ok(parsed_list)
        else:

            def serialize_params_to_string(df: pd.DataFrame) -> pd.DataFrame:
                return df.astype(str)  # type: ignore[pandas]

            return Ok(
                [
                    TextBasedInputDatum(frozendict(r))  # type: ignore[pandas]
                    for r in serialize_params_to_string(df).to_dict("records")  # type: ignore[pandas]
                ]
            )
    except Exception as e:
        return Err(f"Could not convert df, {e}.")


async def _run_one_input(
    aiconfig_path: str,
    prompt_name: str,
    aiconfig_params: TextBasedInputDatum,
) -> Result[str, str]:
    return await result.do_async(
        await run_aiconfig_on_text_based_input(
            runtime=_aiconfig_no_stderr(aiconfig_ok),
            prompt_name=prompt_name,
            params=aiconfig_params,
        )
        for aiconfig_ok in _load_aiconfig(aiconfig_path)
    )


def _aiconfig_no_stderr(
    aiconfig: AIConfigRuntime,
) -> AIConfigRuntime:
    aiconfig.callback_manager = CallbackManager([])
    return aiconfig


async def run_aiconfig_inputs_list(
    aiconfig_path: str,
    prompt_name: str,
    aiconfig_params_list: list[TextBasedInputDatum],
) -> Result[list[str], str]:
    outputs = await asyncio.gather(
        *[
            _run_one_input(
                aiconfig_path,
                prompt_name,
                aiconfig_params,
            )
            for aiconfig_params in aiconfig_params_list
        ]
    )

    return core_utils.result_reduce_list_all_ok(outputs)


def _parse_params(aiconfig_input: str) -> Result[TextBasedInputDatum, str]:
    loaded = core_utils.safe_load_json(aiconfig_input)
    match loaded:
        case Ok(loaded_ok):
            if all(isinstance(value, str) for value in loaded_ok.values()):
                str_to_str = cast(dict[str, str], loaded_ok)
                return Ok(TextBasedInputDatum(frozendict(str_to_str)))
            else:
                return Err(
                    "Got a JSONObject, but not a dict[str, str]."
                    "All values in the input must be strings. Got {loaded_ok}."
                )
        case Err(loaded_err):
            LOGGER.warning(
                f"Assuming input {aiconfig_input} is a string corresponding to '{{the_query}}'."
            )
            return Ok(TextBasedInputDatum(loaded_err))


if __name__ == "__main__":
    asyncio.run(main())
