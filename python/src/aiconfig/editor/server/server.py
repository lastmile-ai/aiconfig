from dataclasses import dataclass
import logging
from types import ModuleType
from typing import Callable, Optional

import lastmile_utils.lib.core.api as core_utils
from flask import Flask, request
from result import Err, Ok, Result

from aiconfig.Config import AIConfigRuntime
import importlib

import importlib.util
import sys
import os

from aiconfig.model_parser import InferenceOptions


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
    parsers_module_path: str = "aiconfig_model_registry.py"


@dataclass
class ServerState:
    aiconfig: AIConfigRuntime | None = None


@dataclass(frozen=True)
class HttpPostResponse:
    message: str
    output: str | None = None
    code: int = 200

    def to_flask_format(self) -> tuple[dict[str, str], int]:
        out: dict[str, str] = {}
        out["message"] = self.message
        if self.output is not None:
            out["output"] = self.output

        return out, self.code


def _get_server_state(app: Flask) -> ServerState:
    return app.server_state  # type: ignore


def _resolve_path(path: str) -> str:
    return os.path.abspath(os.path.expanduser(path))


def _import_module_from_path(path_to_module: str) -> Result[ModuleType, str]:
    LOGGER.debug(f"{path_to_module=}")
    resolved_path = _resolve_path(path_to_module)
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


def _load_user_parser_module(path_to_module: str) -> Result[None, str]:
    LOGGER.info(f"Importing parsers module from {path_to_module}")
    res_user_module = _import_module_from_path(path_to_module)
    register_result = (
        res_user_module.and_then(_load_register_fn_from_user_module)  #
        #
        .and_then(_register_user_model_parsers)
    )
    return register_result


def _get_http_response_load_user_parser_module(path_to_module: str) -> HttpPostResponse:
    register_result = _load_user_parser_module(path_to_module)
    match register_result:
        case Ok(_):
            msg = f"Successfully registered model parsers from {path_to_module}"
            LOGGER.info(msg)
            return HttpPostResponse(
                message=msg,
            )
        case Err(e):
            msg = f"Failed to register model parsers from {path_to_module}: {e}"
            LOGGER.error(msg)
            return HttpPostResponse(
                message=msg,
                code=400,
            )


app = Flask(__name__, static_url_path="")


@app.route("/")
def home():
    return app.send_static_file("index.html")


@app.route("/api/load_model_parser_module", methods=["POST"])
def load_model_parser_module():
    def _run_with_path(path: str) -> HttpPostResponse:
        return _get_http_response_load_user_parser_module(path)

    result = _http_response_with_path(_run_with_path)
    return result.to_flask_format()


def _get_validated_request_path(raw_path: str) -> Result[str, str]:
    if not raw_path:
        return Err("No path provided")
    resolved = _resolve_path(raw_path)
    if not os.path.isfile(resolved):
        return Err(f"File does not exist: {resolved}")
    return Ok(resolved)


def _http_response_with_path(path_fn: Callable[[str], HttpPostResponse]) -> HttpPostResponse:
    request_json = request.get_json()
    path = request_json.get("path", None)

    validated_path = _get_validated_request_path(path)
    match validated_path:
        case Ok(path):
            return path_fn(path)
        case Err(e):
            return HttpPostResponse(message=e, code=400)


@app.route("/api/load", methods=["POST"])
def load():
    def _run_with_path(path: str) -> HttpPostResponse:
        LOGGER.info(f"Loading AIConfig from {path}")
        state = _get_server_state(app)
        try:
            state.aiconfig = AIConfigRuntime.load(path)  # type: ignore
            return HttpPostResponse(message="Done")
        except Exception as e:
            return HttpPostResponse(message=f"<p>Failed to load AIConfig from {path}: {e}", code=400)

    return _http_response_with_path(_run_with_path).to_flask_format()


@app.route("/api/save", methods=["POST"])
def save():
    def _run_with_path(path: str) -> HttpPostResponse:
        LOGGER.info(f"Saving AIConfig to {path}")
        state = _get_server_state(app)
        try:
            state.aiconfig.save(path)  # type: ignore
            return HttpPostResponse(message="Done")
        except Exception as e:
            err: Err[str] = core_utils.ErrWithTraceback(e)
            LOGGER.error(f"Failed to save AIConfig to {path}: {err}")
            return HttpPostResponse(message=f"<p>Failed to save AIConfig to {path}: {err}", code=400)

    return _http_response_with_path(_run_with_path).to_flask_format()


@app.route("/api/create", methods=["POST"])
def create():
    state = _get_server_state(app)
    state.aiconfig = AIConfigRuntime.create()  # type: ignore
    return {"message": "Done"}, 200


@app.route("/api/run", methods=["POST"])
async def run():
    state = _get_server_state(app)
    request_json = request.get_json()
    prompt_name = request_json.get("prompt_name", None)
    stream = request_json.get("stream", True)
    LOGGER.info(f"Running prompt: {prompt_name}, {stream=}")
    inference_options = InferenceOptions(stream=stream)
    try:
        result = await state.aiconfig.run(prompt_name, options=inference_options)  # type: ignore
        LOGGER.debug(f"Result: {result=}")
        result_text = str(
            state.aiconfig.get_output_text(prompt_name)  # type: ignore
            #
            if isinstance(result, list)
            #
            else result.data[0]  # type: ignore
        )
        return {"message": "Done", "output": result_text}, 200
    except Exception as e:
        err: Err[str] = core_utils.ErrWithTraceback(e)
        LOGGER.error(f"Failed to run: {err}")
        return {"message": f"<p>Failed to run: {err}"}, 400


@app.route("/api/add_prompt", methods=["POST"])
def add_prompt():
    state = _get_server_state(app)
    request_json = request.get_json()
    try:
        LOGGER.info(f"Adding prompt: {request_json}")
        state.aiconfig.add_prompt(**request_json)  # type: ignore
        return {"message": "Done"}, 200
    except Exception as e:
        err: Err[str] = core_utils.ErrWithTraceback(e)
        LOGGER.error(f"Failed to add prompt: {err}")
        return {"message": f"<p>Failed to add prompt: {err}"}, 400


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


def _load_user_parser_module_if_exists(parsers_module_path: str) -> None:
    _get_validated_request_path(parsers_module_path).and_then(_load_user_parser_module).map_or_else(
        lambda e: LOGGER.warning(f"Failed to load parsers module: {e}"),  # type: ignore
        lambda _: LOGGER.info(f"Loaded parsers module from {edit_config.parsers_module_path}"),  # type: ignore
    )


def _init_server_state(app: Flask, edit_config: EditServerConfig) -> None:
    assert edit_config.server_mode in {"debug_servers", "debug_backend", "prod"}
    LOGGER.info("Initializing server state")
    _load_user_parser_module_if_exists(edit_config.parsers_module_path)
    state = _get_server_state(app)

    assert state.aiconfig is None
    if edit_config.aiconfig_path:
        LOGGER.info(f"Loading AIConfig from {edit_config.aiconfig_path}")
        aiconfig_runtime = AIConfigRuntime.load(edit_config.aiconfig_path)  # type: ignore
        state.aiconfig = aiconfig_runtime
        LOGGER.info(f"Loaded AIConfig from {edit_config.aiconfig_path}")
    else:
        aiconfig_runtime = AIConfigRuntime.create()  # type: ignore
        state.aiconfig = aiconfig_runtime
        LOGGER.info("Created new AIConfig")
