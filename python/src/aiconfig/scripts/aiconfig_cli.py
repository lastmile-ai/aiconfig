import logging
import signal
import socket
import subprocess
import sys

import lastmile_utils.lib.core.api as core_utils
import result
from result import Err, Ok, Result

from aiconfig.editor.server.server_utils import EditServerConfig, ServerMode
from aiconfig.editor.server.server import run_backend_server as run_backend_server_v1
from aiconfig.editor.server.server_v2 import run_backend_server as run_backend_server_v2


class AIConfigCLIConfig(core_utils.Record):
    log_level: str | int = "WARNING"


logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)


def main(argv: list[str]) -> int:
    final_result = run_subcommand(argv)
    match final_result:
        case Ok(msg):
            LOGGER.info("Final result: Ok:\n%s", msg)
            return 0
        case Err(e):
            LOGGER.critical("Final result err: %s", e)
            return core_utils.result_to_exitcode(Err(e))


def run_subcommand(argv: list[str]) -> Result[str, str]:
    LOGGER.info("Running subcommand")
    subparser_record_types = {"edit": EditServerConfig}
    main_parser = core_utils.argparsify(AIConfigCLIConfig, subparser_record_types=subparser_record_types)

    res_cli_config = core_utils.parse_args(main_parser, argv[1:], AIConfigCLIConfig)
    res_cli_config.and_then(_process_cli_config)

    subparser_name = core_utils.get_subparser_name(main_parser, argv[1:])
    LOGGER.info(f"Running subcommand: {subparser_name}")

    if subparser_name == "edit":
        LOGGER.debug("Running edit subcommand")
        res_edit_config = core_utils.parse_args(main_parser, argv[1:], EditServerConfig)
        LOGGER.debug(f"{res_edit_config.is_ok()=}")
        res_servers = res_edit_config.and_then(_run_editor_servers)
        out: Result[str, str] = result.do(
            #
            Ok(",".join(res_servers_ok))
            #
            for res_servers_ok in res_servers
        )
        return out
    else:
        return Err(f"Unknown subparser: {subparser_name}")


def _sigint(procs: list[subprocess.Popen[bytes]]) -> Result[str, str]:
    LOGGER.info("sigint")
    for p in procs:
        p.send_signal(signal.SIGINT)
    return Ok("Sent SIGINT to frontend servers.")


def is_port_in_use(port: int) -> bool:
    """
    Checks if a port is in use at localhost.

    Creates a temporary connection.
    Context manager will automatically close the connection
    """
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", port)) == 0


def _run_editor_servers(edit_config: EditServerConfig) -> Result[list[str], str]:
    port = edit_config.server_port

    while is_port_in_use(port):
        LOGGER.warning(f"Port {port} is in use. Checking next port.")
        port += 1

    # Must reconstruct, EditServerConfig is an immutable type (frozen dataclass)
    edit_config_dict = edit_config.model_dump()
    edit_config_dict["server_port"] = port
    edit_config = EditServerConfig(**edit_config_dict)

    LOGGER.warning(f"Using {port}.")

    # Check if server is already running
    LOGGER.info("Running editor servers")
    frontend_procs = _run_frontend_server_background() if edit_config.server_mode in [ServerMode.DEBUG_SERVERS] else Ok([])
    match frontend_procs:
        case Ok(_):
            pass
        case Err(e):
            return Err(e)

    results: list[Result[str, str]] = []
    run_backend_server = {
        "v1": run_backend_server_v1,
        "v2": run_backend_server_v2,
    }[edit_config.server_version]
    backend_res = run_backend_server(edit_config)
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
    LOGGER.setLevel(cli_config.log_level)
    return Ok(True)


def _run_frontend_server_background() -> Result[list[subprocess.Popen[bytes]], str]:
    LOGGER.info("Running frontend server in background")
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


if __name__ == "__main__":
    retcode: int = main(sys.argv)
    sys.exit(retcode)
