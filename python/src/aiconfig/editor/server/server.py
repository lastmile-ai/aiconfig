from dataclasses import dataclass
from enum import Enum
import logging
from types import ModuleType
from typing import Any, Callable, NewType, Optional

import lastmile_utils.lib.core.api as core_utils
from flask import Flask, request
from pydantic import field_validator
from result import Err, Ok, Result
import result

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

UnvalidatedPath = NewType("UnvalidatedPath", str)
ValidatedPath = NewType("ValidatedPath", str)


class ServerMode(Enum):
    # debug = "DEBUG"
    DEBUG_SERVERS = "DEBUG_SERVERS"
    DEBUG_BACKEND = "DEBUG_BACKEND"
    PROD = "PROD"


class EditServerConfig(core_utils.Record):
    server_port: int = 8080
    aiconfig_path: Optional[str] = None
    log_level: str | int = "INFO"
    server_mode: ServerMode
    parsers_module_path: str = "aiconfig_model_registry.py"

    @field_validator("server_mode", mode="before")
    def convert_to_mode(cls, value: Any) -> ServerMode:  # pylint: disable=no-self-argument
        if isinstance(value, str):
            try:
                return ServerMode[value.upper()]
            except KeyError as e:
                raise ValueError(f"Unexpected value for mode: {value}") from e
        return value


@dataclass
class ServerState:
    aiconfig: AIConfigRuntime | None = None


FlaskPostResponse = NewType("FlaskPostResponse", tuple[dict[str, str | core_utils.JSONObject], int])


@dataclass(frozen=True)
class HttpPostResponse:
    message: str
    aiconfig: AIConfigRuntime | None
    code: int = 200

    EXCLUDE_OPTIONS = {
        "prompt_index": True,
        "file_path": True,
        "callback_manager": True,
    }

    def to_flask_format(self) -> FlaskPostResponse:
        out: dict[str, str | core_utils.JSONObject] = {
            "message": self.message,
        }
        if self.aiconfig is not None:
            out["aiconfig"] = self.aiconfig.model_dump(exclude=HttpPostResponse.EXCLUDE_OPTIONS)

        return FlaskPostResponse((out, self.code))


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
            return HttpPostResponse(message=msg, aiconfig=None)
        case Err(e):
            msg = f"Failed to register model parsers from {path_to_module}: {e}"
            LOGGER.error(msg)
            return HttpPostResponse(message=msg, code=400, aiconfig=None)


app = Flask(__name__, static_url_path="")


@app.route("/")
def home():
    return app.send_static_file("index.html")


@app.route("/api/load_model_parser_module", methods=["POST"])
def load_model_parser_module() -> FlaskPostResponse:
    path = _validated_request_path()

    def _to_flask(resp: HttpPostResponse) -> FlaskPostResponse:
        return resp.to_flask_format()

    res_response = path.map(_get_http_response_load_user_parser_module).map(_to_flask)
    return res_response.unwrap_or(
        HttpPostResponse(
            message="Failed to load model parser module",
            code=400,
            aiconfig=None
            #
        ).to_flask_format()
    )


def _get_validated_path(raw_path: str, allow_create: bool = False) -> Result[ValidatedPath, str]:
    LOGGER.debug(f"{allow_create=}")
    if not raw_path:
        return Err("No path provided")
    resolved = _resolve_path(raw_path)
    if not allow_create and not os.path.isfile(resolved):
        return Err(f"File does not exist: {resolved}")
    return Ok(ValidatedPath(resolved))


def _validated_request_path(allow_create: bool = False) -> Result[ValidatedPath, str]:
    request_json = request.get_json()
    path = request_json.get("path", None)
    return _get_validated_path(path, allow_create=allow_create)


@app.route("/api/load", methods=["POST"])
def load() -> FlaskPostResponse:
    state = _get_server_state(app)

    path_val = _validated_request_path()
    res_aiconfig = path_val.and_then(_safe_load_from_disk)
    match res_aiconfig:
        case Ok(aiconfig):
            LOGGER.warning(f"Loaded AIConfig from {path_val}. This may have overwritten in-memory changes.")
            state.aiconfig = aiconfig
            return HttpPostResponse(message="Loaded", aiconfig=aiconfig).to_flask_format()
        case Err(e):
            return HttpPostResponse(message=f"Failed to load AIConfig: {path_val}, {e}", code=400, aiconfig=None).to_flask_format()


@app.route("/api/save", methods=["POST"])
def save() -> FlaskPostResponse:
    state = _get_server_state(app)
    if state.aiconfig is None:
        return HttpPostResponse(message="No AIConfig in memory, nothing to save.", code=400, aiconfig=None).to_flask_format()
    else:
        aiconfig: AIConfigRuntime = state.aiconfig

        path_val = _validated_request_path(allow_create=True)
        res_save: Result[HttpPostResponse, str] = result.do(
            Ok(HttpPostResponse(message="Saved to disk", aiconfig=aiconfig))
            for path_val_ok in path_val
            for _ in _safe_save_to_disk(aiconfig, path_val_ok)
        )
        return res_save.unwrap_or(
            HttpPostResponse(
                #
                message="Failed to save to disk",
                code=400,
                aiconfig=None,
            )
        ).to_flask_format()


@app.route("/api/create", methods=["POST"])
def create() -> FlaskPostResponse:
    state = _get_server_state(app)
    state.aiconfig = AIConfigRuntime.create()  # type: ignore
    return HttpPostResponse(message="Created new AIConfig", aiconfig=state.aiconfig).to_flask_format()


@app.route("/api/run", methods=["POST"])
async def run() -> FlaskPostResponse:
    state = _get_server_state(app)
    request_json = request.get_json()
    prompt_name = request_json.get("prompt_name", None)
    stream = request_json.get("stream", True)
    LOGGER.info(f"Running prompt: {prompt_name}, {stream=}")
    inference_options = InferenceOptions(stream=stream)
    try:
        result = await state.aiconfig.run(prompt_name, options=inference_options)  # type: ignore
        LOGGER.debug(f"Result: {result=}")
        return HttpPostResponse(
            message="Done",
            aiconfig=state.aiconfig,
        ).to_flask_format()
        # return {"message": "Done", "output": result_text}, 200
    except Exception as e:
        err: Err[str] = core_utils.ErrWithTraceback(e)
        LOGGER.error(f"Failed to run: {err}")
        return HttpPostResponse(
            message=f"Failed to run: {err}",
            code=400,
            aiconfig=None,
        ).to_flask_format()


@app.route("/api/add_prompt", methods=["POST"])
def add_prompt() -> FlaskPostResponse:
    state = _get_server_state(app)
    request_json = request.get_json()
    try:
        LOGGER.info(f"Adding prompt: {request_json}")
        state.aiconfig.add_prompt(**request_json)  # type: ignore
        return HttpPostResponse(
            message="Done",
            aiconfig=state.aiconfig,
        ).to_flask_format()
    except Exception as e:
        err: Err[str] = core_utils.ErrWithTraceback(e)
        LOGGER.error(f"Failed to add prompt: {err}")
        return HttpPostResponse(
            message=f"Failed to add prompt: {err}",
            code=400,
            aiconfig=None,
        ).to_flask_format()


def run_backend_server(edit_config: EditServerConfig) -> Result[str, str]:
    LOGGER.setLevel(edit_config.log_level)
    LOGGER.info("Edit config: %s", edit_config.model_dump_json())
    LOGGER.info(f"Starting server on http://localhost:{edit_config.server_port}")

    app.server_state = ServerState()  # type: ignore
    res_server_state_init = _init_server_state(app, edit_config)
    match res_server_state_init:
        case Ok(_):
            LOGGER.info("Initialized server state")
            debug = edit_config.server_mode in [ServerMode.DEBUG_BACKEND, ServerMode.DEBUG_SERVERS]
            LOGGER.info(f"Running in {edit_config.server_mode} mode")
            app.run(port=edit_config.server_port, debug=debug, use_reloader=True)
            return Ok("Done")
        case Err(e):
            LOGGER.error(f"Failed to initialize server state: {e}")
            return Err(f"Failed to initialize server state: {e}")


def _load_user_parser_module_if_exists(parsers_module_path: str) -> None:
    res = _get_validated_path(parsers_module_path).and_then(_load_user_parser_module)
    match res:
        case Ok(_):
            LOGGER.info(f"Loaded parsers module from {parsers_module_path}")
        case Err(e):
            LOGGER.warning(f"Failed to load parsers module: {e}")


def _safe_load_from_disk(aiconfig_path: ValidatedPath) -> Result[AIConfigRuntime, str]:
    try:
        aiconfig = AIConfigRuntime.load(aiconfig_path)  # type: ignore
        return Ok(aiconfig)
    except Exception as e:
        return core_utils.ErrWithTraceback(e)


def _safe_save_to_disk(aiconfig: AIConfigRuntime, aiconfig_path: ValidatedPath) -> Result[None, str]:
    try:
        save_res = aiconfig.save(aiconfig_path)
        return Ok(save_res)
    except Exception as e:
        return core_utils.ErrWithTraceback(e)


def _init_server_state(app: Flask, edit_config: EditServerConfig) -> Result[None, str]:
    LOGGER.info("Initializing server state")
    _load_user_parser_module_if_exists(edit_config.parsers_module_path)
    state = _get_server_state(app)

    assert state.aiconfig is None
    if edit_config.aiconfig_path:
        LOGGER.info(f"Loading AIConfig from {edit_config.aiconfig_path}")
        val_path = _get_validated_path(edit_config.aiconfig_path)
        aiconfig_runtime = val_path.and_then(_safe_load_from_disk)
        LOGGER.debug(f"{aiconfig_runtime.is_ok()=}")
        match aiconfig_runtime:
            case Ok(aiconfig_runtime_):
                state.aiconfig = aiconfig_runtime_
                LOGGER.info(f"Loaded AIConfig from {edit_config.aiconfig_path}")
                return Ok(None)
            case Err(e):
                LOGGER.error(f"Failed to load AIConfig from {edit_config.aiconfig_path}: {e}")
                return Err(f"Failed to load AIConfig from {edit_config.aiconfig_path}: {e}")
    else:
        aiconfig_runtime = AIConfigRuntime.create()  # type: ignore
        state.aiconfig = aiconfig_runtime
        LOGGER.info("Created new AIConfig")
        return Ok(None)
