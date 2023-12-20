import asyncio
import logging
import sys

import lastmile_utils.lib.core.api as core_utils
from aiconfig.editor.server.server import EditConfig, run_server
from result import Err, Ok, Result


class AIConfigCLIConfig(core_utils.Record):
    log_level: str | int = "WARNING"


logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)


async def main(argv: list[str]) -> int:
    final_result = run_subcommand(argv)
    match final_result:
        case Ok(msg):
            LOGGER.info("Ok:\n%s", msg)
            return 0
        case Err(e):
            LOGGER.critical("err: %s", e)
            return core_utils.result_to_exitcode(Err(e))


def run_subcommand(argv: list[str]) -> Result[int, str]:
    subparser_rs = {"edit": EditConfig}
    main_parser = core_utils.argparsify(AIConfigCLIConfig, subparser_rs=subparser_rs)

    res_cli_config = core_utils.parse_args(main_parser, argv[1:], AIConfigCLIConfig)
    res_cli_config.and_then(_process_cli_config)

    subparser_name = core_utils.get_subparser_name(main_parser, argv[1:])

    if subparser_name == "edit":
        res_edit_config = core_utils.parse_args(main_parser, argv[1:], EditConfig)
        return res_edit_config.and_then(run_server)
    else:
        return Err(f"Unknown subparser: {subparser_name}")


def _process_cli_config(cli_config: AIConfigCLIConfig) -> Result[bool, str]:
    LOGGER.setLevel(cli_config.log_level)
    return Ok(True)


if __name__ == "__main__":
    retcode: int = asyncio.run(main(sys.argv))
    sys.exit(retcode)
