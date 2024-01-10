import asyncio
import logging
import signal
import subprocess
import sys

import lastmile_utils.lib.core.api as core_utils
import result
from result import Err, Ok, Result

import aiconfig.editor.server.server_v2_common as server_common
from aiconfig.editor.server.server_v2 import run_backend_server


class AIConfigCLIConfig(core_utils.Record):
    log_level: str | int = "WARNING"


logging.basicConfig(format=core_utils.LOGGER_FMT)
logger = logging.getLogger("aiconfig")


async def main_with_args(argv: list[str]) -> int:
    final_result = await run_subcommand(argv)
    match final_result:
        case Ok(msg):
            logger.info("Final result: Ok:\n%s", msg)
            return 0
        case Err(e):
            logger.critical("Final result err: %s", e)
            return core_utils.result_to_exitcode(Err(e))


async def run_subcommand(argv: list[str]) -> Result[str, str]:
    logger.info("Running subcommand")
    subparser_record_types = {"edit": server_common.EditServerConfig}
    main_parser = core_utils.argparsify(AIConfigCLIConfig, subparser_record_types=subparser_record_types)

    res_cli_config = core_utils.parse_args(main_parser, argv[1:], AIConfigCLIConfig)
    res_cli_config.and_then(_process_cli_config)

    subparser_name = core_utils.get_subparser_name(main_parser, argv[1:])
    logger.info(f"Running subcommand: {subparser_name}")

    if subparser_name == "edit":
        logger.debug("Running edit subcommand")
        res_edit_config = core_utils.parse_args(main_parser, argv[1:], server_common.EditServerConfig)
        logger.debug(f"{res_edit_config.is_ok()=}")
        res_servers = await res_edit_config.and_then_async(_run_editor_servers)
        out: Result[str, str] = await result.do_async(
            #
            Ok(",".join(res_servers_ok))
            #
            for res_servers_ok in res_servers
        )
        return out
    else:
        return Err(f"Unknown subparser: {subparser_name}")


def _sigint(procs: list[subprocess.Popen[bytes]]) -> Result[str, str]:
    logger.info("sigint")
    for p in procs:
        p.send_signal(signal.SIGINT)
    return Ok("Sent SIGINT to frontend servers.")


async def _run_editor_servers(edit_config: server_common.EditServerConfig) -> Result[list[str], str]:
    logger.info("Running editor servers")
    frontend_procs = _run_frontend_server_background() if edit_config.server_mode in [server_common.ServerMode.DEBUG_SERVERS] else Ok([])
    match frontend_procs:
        case Ok(_):
            pass
        case Err(e):
            return Err(e)

    results: list[Result[str, str]] = []
    backend_res = await run_backend_server(edit_config)
    match backend_res:
        case Ok(_):
            pass
        case Err(e):
            return Err(e)

    results.append(backend_res)

    sigint_res = frontend_procs.and_then(_sigint)
    results.append(sigint_res)
    return core_utils.result_reduce_list_all_ok(results)


def _process_cli_config(cli_config: AIConfigCLIConfig) -> Result[bool, str]:
    logger.setLevel(cli_config.log_level)
    return Ok(True)


def _run_frontend_server_background() -> Result[list[subprocess.Popen[bytes]], str]:
    logger.info("Running frontend server in background")
    p1, p2 = None, None
    try:
        p1 = subprocess.Popen(["yarn"], cwd="python/src/aiconfig/editor/client")
    except Exception as e:
        return core_utils.ErrWithTraceback(e)

    try:
        p2 = subprocess.Popen(["yarn", "start"], cwd="python/src/aiconfig/editor/client", stdin=subprocess.PIPE)
    except Exception as e:
        return core_utils.ErrWithTraceback(e)

    try:
        assert p2.stdin is not None
        p2.stdin.write(b"n\n")
    except Exception as e:
        return core_utils.ErrWithTraceback(e)

    return Ok([p1, p2])


def main() -> int:
    argv = sys.argv
    return asyncio.run(main_with_args(argv))


if __name__ == "__main__":
    retcode: int = main()
    sys.exit(retcode)
