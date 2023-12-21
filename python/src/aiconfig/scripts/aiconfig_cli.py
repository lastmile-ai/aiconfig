import asyncio
import logging
import signal
import subprocess
import sys

import lastmile_utils.lib.core.api as core_utils
import result
from aiconfig.editor.server.server import EditConfig, run_backend_server
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
        _ = res_edit_config.and_then(_run_servers)
        return Ok(0)
    else:
        return Err(f"Unknown subparser: {subparser_name}")


def _run_servers(edit_config: EditConfig) -> Result[None, str]:
    frontend_procs = _run_frontend_server_background() if edit_config.server_mode == "debug" else Ok([])
    print(f"{frontend_procs=}")

    def _sigint(procs: list[subprocess.Popen[bytes]]) -> Result[None, str]:
        LOGGER.info("sigint")
        for p in procs:
            p.send_signal(signal.SIGINT)
        return Ok(None)

    return result.do(_sigint(frontend_procs_ok) for frontend_procs_ok in frontend_procs for _ in run_backend_server(edit_config))


def _process_cli_config(cli_config: AIConfigCLIConfig) -> Result[bool, str]:
    LOGGER.setLevel(cli_config.log_level)
    return Ok(True)


def _run_frontend_server_background() -> Result[list[subprocess.Popen[bytes]], str]:
    LOGGER.info("Running frontend server in background")
    try:
        p1 = subprocess.Popen(["yarn"], cwd="src/aiconfig/editor/client")
        p2 = subprocess.Popen(["yarn", "start"], cwd="src/aiconfig/editor/client")
        return Ok([p1, p2])
    except Exception as e:
        return core_utils.ErrWithTraceback(e)


if __name__ == "__main__":
    retcode: int = asyncio.run(main(sys.argv))
    sys.exit(retcode)
