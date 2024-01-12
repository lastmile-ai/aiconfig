import asyncio
import logging
import os
import signal
import socket
import subprocess
import sys

import lastmile_utils.lib.core.api as core_utils
from ruamel.yaml import YAML

from aiconfig.editor.server.server import run_backend_server
from aiconfig.editor.server.server_utils import DEFAULT_AICONFIGRC, EditServerConfig, ServerMode
from result import Err, Ok, Result

import aiconfig.scripts.rage.rage as rage


class AIConfigCLIConfig(core_utils.Record):
    log_level: str | int = "WARNING"
    aiconfigrc_path: str = os.path.join(os.path.expanduser("~"), ".aiconfigrc")


logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)


async def main_with_args(argv: list[str]) -> int:
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
    subparser_record_types = {"edit": EditServerConfig, "rage": rage.RageConfig}
    main_parser = core_utils.argparsify(AIConfigCLIConfig, subparser_record_types=subparser_record_types)

    # Try to parse the CLI args into a config.
    cli_config: Result[AIConfigCLIConfig, str] = core_utils.parse_args(main_parser, argv[1:], AIConfigCLIConfig)

    # If cli_config is Ok(), pass its contents to _get_cli_process_result_from_config().
    # Otherwise, short circuit and assign process_result to the Err.
    # Nothing gets mutated except for log level (see inside _get_cli_process_result_from_config()
    process_result = cli_config.and_then(_set_log_level_and_create_default_yaml)
    LOGGER.info(f"{process_result=}")

    subparser_name = core_utils.get_subparser_name(main_parser, argv[1:])
    LOGGER.info(f"Running subcommand: {subparser_name}")

    if subparser_name == "edit":
        LOGGER.debug("Running edit subcommand")
        edit_config = core_utils.parse_args(main_parser, argv[1:], EditServerConfig)
        LOGGER.debug(f"{edit_config.is_ok()=}")
        out = _run_editor_servers_with_configs(edit_config, cli_config)
        return out
    elif subparser_name == "rage":
        res_rage_config = core_utils.parse_args(main_parser, argv[1:], rage.RageConfig)
        res_rage = res_rage_config.and_then(rage.rage)
        match res_rage:
            case Ok(msg):
                return Ok(f"Rage complete: {msg}")
            case Err(e):
                return Err(e)
    else:
        return Err(f"Unknown subparser: {subparser_name}")


def _run_editor_servers_with_configs(edit_config: Result[EditServerConfig, str], cli_config: Result[AIConfigCLIConfig, str]) -> Result[str, str]:
    if not (edit_config.is_ok() and cli_config.is_ok()):
        return Err(f"Something went wrong with configs: {edit_config=}, {cli_config=}")

    server_outcomes = _run_editor_servers(edit_config.unwrap(), cli_config.unwrap().aiconfigrc_path)
    if server_outcomes.is_err():
        return Err(f"Something went wrong with servers: {server_outcomes=}")

    return Ok(",".join(server_outcomes.unwrap()))


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


def _run_editor_servers(edit_config: EditServerConfig, aiconfigrc_path: str) -> Result[list[str], str]:
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
    backend_res = run_backend_server(edit_config, aiconfigrc_path)
    match backend_res:
        case Ok(_):
            pass
        case Err(e):
            return Err(e)

    results.append(backend_res)

    sigint_res = frontend_procs.and_then(_sigint)
    results.append(sigint_res)
    return core_utils.result_reduce_list_all_ok(results)


def _set_log_level_and_create_default_yaml(cli_config: AIConfigCLIConfig) -> Result[bool, str]:
    """
    This function has 2 jobs (currently):
    1. Set the log level
    2. Write the default aiconfigrc if it doesn't exist.

    It returns Ok(True) if everything went well. Currently, it never returns Ok(False).
    As usual, we return an error with a message if something went wrong.
    """
    aiconfigrc_path = cli_config.aiconfigrc_path

    LOGGER.setLevel(cli_config.log_level)
    try:
        with open(aiconfigrc_path, "x") as f:
            YAML().dump(DEFAULT_AICONFIGRC, f)

        return Ok(True)
    except FileExistsError:
        try:

            def _read() -> str:
                with open(aiconfigrc_path, "r") as f:
                    return f.read()

            contents = YAML().load(_read())
            with open(aiconfigrc_path, "w") as f:
                if contents is None:
                    contents = {}

                for k, v in DEFAULT_AICONFIGRC.items():
                    if k not in contents:
                        contents[k] = v

                YAML().dump(contents, f)  # type: ignore[yaml library untyped]
                return Ok(True)
        except Exception as e:
            return core_utils.ErrWithTraceback(e)
    except Exception as e:
        return core_utils.ErrWithTraceback(e)


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


def main() -> int:
    argv = sys.argv
    return asyncio.run(main_with_args(argv))


if __name__ == "__main__":
    retcode: int = main()
    sys.exit(retcode)
