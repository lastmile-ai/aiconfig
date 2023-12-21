from dataclasses import dataclass
import logging
from types import ModuleType
from typing import Callable, Optional

import lastmile_utils.lib.core.api as core_utils
from flask import Flask
from result import Err, Ok, Result

from aiconfig.Config import AIConfigRuntime
import importlib

import importlib.util
import sys
import os


def _import_module_from_path(path_to_module: str) -> Result[ModuleType, str]:
    LOGGER.debug(f"{path_to_module=}")
    resolved_path = os.path.abspath(os.path.expanduser(path_to_module))
    LOGGER.debug(f"{resolved_path=}")
    module_name = os.path.basename(resolved_path).replace(".py", "")

    try:
        spec = importlib.util.spec_from_file_location(module_name, resolved_path)
        if spec is None:
            return Err(f"Could not import module from path: {resolved_path}")
        elif spec.loader is None:
            return Err(f"Could not import module from path: {resolved_path} (no loader)")
        else:
            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module
            spec.loader.exec_module(module)
            return Ok(module)
    except Exception as e:
        return core_utils.ErrWithTraceback(e)


def _load_register_fn_from_user_module(user_module: ModuleType) -> Result[Callable[[], None], str]:
    if not hasattr(user_module, "register_model_parsers"):
        return Err(f"User module {user_module} does not have a register_model_parsers function.")
    register_fn = getattr(user_module, "register_model_parsers")
    if not callable(register_fn):
        return Err(f"User module {user_module} does not have a register_model_parsers function")
    else:
        return Ok(register_fn)


def _register_user_model_parsers(user_register_fn: Callable[[], None]) -> Result[None, str]:
    try:
        return Ok(user_register_fn())
    except Exception as e:
        return core_utils.ErrWithTraceback(e)


def _load_user_module_from_path_and_register_model_parsers(path_to_module: str) -> Result[str, str]:
    res_user_module = _import_module_from_path(path_to_module)
    register_result = (
        res_user_module.and_then(_load_register_fn_from_user_module)  #
        #
        .and_then(_register_user_model_parsers)
    )
    match register_result:
        case Ok(_):
            msg = f"Successfully registered model parsers from {path_to_module}"
            LOGGER.info(msg)
            return Ok(msg)
        case Err(e):
            msg = f"Failed to register model parsers from {path_to_module}: {e}"
            LOGGER.warning(msg)
            return Err(msg)


# UserClass = getattr(user_module, "UserClass")


logging.getLogger("werkzeug").disabled = True

logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)

log_handler = logging.FileHandler("editor_flask_server.log", mode="a")
formatter = logging.Formatter(core_utils.LOGGER_FMT)
log_handler.setFormatter(formatter)

LOGGER.addHandler(log_handler)


class EditServerConfig(core_utils.Record):
    server_port: int = 8080
    aiconfig_path: Optional[str] = None
    log_level: str | int = "INFO"
    server_mode: str
    parsers_module_path: Optional[str] = None


app = Flask(__name__, static_url_path="")


@dataclass
class ServerState:
    count = 0
    aiconfig_runtime: AIConfigRuntime | None = None


def _get_server_state(app: Flask) -> ServerState:
    return app.server_state  # type: ignore


@app.route("/")
def home():
    ss = _get_server_state(app)
    ss.count += 1
    LOGGER.info("Count: %s", ss.count)
    return app.send_static_file("index.html")


@app.route("/test")
def test():
    return {"key": 6}


@app.route("/api/run")
async def run():
    ss = _get_server_state(app)
    result = await ss.aiconfig_runtime.run(
        "gen_packing_list",
        #
        params={"location": "central park"},
    )
    text = result.data[0]
    return f"<p>{text}</p>"


def run_backend_server(edit_config: EditServerConfig) -> Result[int, str]:
    LOGGER.setLevel(edit_config.log_level)
    LOGGER.info("Edit config: %s", edit_config.model_dump_json())
    LOGGER.info(f"Starting server on http://localhost:{edit_config.server_port}")

    app.server_state = ServerState()  # type: ignore
    _init_server_state(app, edit_config)

    if edit_config.server_mode not in {"debug_servers", "debug_backend", "prod"}:
        return Err(f"Unknown server mode: {edit_config.server_mode}")

    debug = edit_config.server_mode in ["debug_servers", "debug_backend"]
    LOGGER.info(f"Running in {edit_config.server_mode} mode")
    app.run(port=edit_config.server_port, debug=debug, use_reloader=True)
    return Ok(0)


def _init_server_state(app: Flask, edit_config: EditServerConfig) -> None:
    if edit_config.parsers_module_path is not None:
        LOGGER.info(f"Importing parsers module from {edit_config.parsers_module_path}")
        _load_user_module_from_path_and_register_model_parsers(edit_config.parsers_module_path)

    LOGGER.info("Initializing server state")
    assert edit_config.server_mode in {"debug_servers", "debug_backend", "prod"}
    ss = _get_server_state(app)

    assert ss.aiconfig_runtime is None
    if edit_config.aiconfig_path:
        LOGGER.info(f"Loading AIConfig from {edit_config.aiconfig_path}")
        aiconfig_runtime = AIConfigRuntime.load(edit_config.aiconfig_path)  # type: ignore
        ss.aiconfig_runtime = aiconfig_runtime
        LOGGER.info(f"Loaded AIConfig from {edit_config.aiconfig_path}")
