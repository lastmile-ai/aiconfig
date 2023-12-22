import logging
from typing import Any, Type, TypeVar

import lastmile_utils.lib.core.api as core_utils
import result
from aiconfig.Config import AIConfigRuntime
from aiconfig.editor.server.server_utils import (
    EditServerConfig,
    FlaskResponse,
    HttpResponseWithAIConfig,
    MethodName,
    OpArgs,
    ServerMode,
    ServerState,
    ValidatedPath,
    get_http_response_load_user_parser_module,
    get_server_state,
    get_validated_path,
    init_server_state,
    make_op_run_method,
    run_aiconfig_operation_with_op_args,
    run_aiconfig_operation_with_request_json,
    safe_load_from_disk,
    safe_run_aiconfig_static_method,
)
from aiconfig.model_parser import InferenceOptions
from flask import Flask, request
from result import Err, Ok, Result

from aiconfig.registry import ModelParserRegistry
from aiconfig.schema import Prompt

logging.getLogger("werkzeug").disabled = True

logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)

log_handler = logging.FileHandler("editor_flask_server.log", mode="a")
formatter = logging.Formatter(core_utils.LOGGER_FMT)
log_handler.setFormatter(formatter)

LOGGER.addHandler(log_handler)

T = TypeVar("T")


app = Flask(__name__, static_url_path="")


def run_backend_server(edit_config: EditServerConfig) -> Result[str, str]:
    LOGGER.setLevel(edit_config.log_level)
    LOGGER.info("Edit config: %s", edit_config.model_dump_json())
    LOGGER.info(f"Starting server on http://localhost:{edit_config.server_port}")

    app.server_state = ServerState()  # type: ignore
    res_server_state_init = init_server_state(app, edit_config)
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


def _validated_request_path(request_json: core_utils.JSONObject, allow_create: bool = False) -> Result[ValidatedPath, str]:
    path = str(request_json.get("path", None))
    return get_validated_path(path, allow_create=allow_create)


@app.route("/")
def home():
    return app.send_static_file("index.html")


@app.route("/api/list_models", methods=["GET"])
def list_models() -> FlaskResponse:
    out: list[str] = ModelParserRegistry.parser_ids()  # type: ignore
    json_obj = core_utils.JSONObject({"data": core_utils.JSONList(out)})
    return FlaskResponse((json_obj, 200))


@app.route("/api/load_model_parser_module", methods=["POST"])
def load_model_parser_module() -> FlaskResponse:
    request_json = request.get_json()
    path = _validated_request_path(request_json)

    res_response = path.map(get_http_response_load_user_parser_module)
    match res_response:
        case Ok(resp):
            return resp.to_flask_format()
        case Err(e):
            return HttpResponseWithAIConfig(message=f"Failed to load model parser module: {e}", code=400, aiconfig=None).to_flask_format()


@app.route("/api/load", methods=["POST"])
def load() -> FlaskResponse:
    state = get_server_state(app)
    request_json = request.get_json()
    path: str | None = request_json.get("path", None)
    if path is None:
        aiconfig = state.aiconfig
        if aiconfig is None:
            return HttpResponseWithAIConfig(message="No AIConfig loaded", code=400, aiconfig=None).to_flask_format()
        else:
            return HttpResponseWithAIConfig(message="AIConfig already loaded. Here it is!", aiconfig=aiconfig).to_flask_format()
    else:
        res_path_val = get_validated_path(path)
        res_aiconfig = res_path_val.and_then(safe_load_from_disk)
        match res_aiconfig:
            case Ok(aiconfig):
                LOGGER.warning(f"Loaded AIConfig from {res_path_val}. This may have overwritten in-memory changes.")
                state.aiconfig = aiconfig
                return HttpResponseWithAIConfig(message="Loaded", aiconfig=aiconfig).to_flask_format()
            case Err(e):
                return HttpResponseWithAIConfig(message=f"Failed to load AIConfig: {res_path_val}, {e}", code=400, aiconfig=None).to_flask_format()


@app.route("/api/save", methods=["POST"])
def save() -> FlaskResponse:
    state = get_server_state(app)
    aiconfig = state.aiconfig
    request_json = request.get_json()

    _op = make_op_run_method(MethodName("save"))

    path_val = _validated_request_path(request_json, allow_create=True)
    op_args: Result[OpArgs, str] = result.do(
        Ok(OpArgs({"path": path_val_ok}))
        #
        for path_val_ok in path_val
    )

    return run_aiconfig_operation_with_op_args(aiconfig, "save", _op, op_args)


@app.route("/api/create", methods=["POST"])
def create() -> FlaskResponse:
    state = get_server_state(app)
    aiconfig = safe_run_aiconfig_static_method(MethodName("create"), OpArgs({}), AIConfigRuntime)
    match aiconfig:
        case Ok(aiconfig_ok):
            state.aiconfig = aiconfig_ok
            return HttpResponseWithAIConfig(message="Created new AIConfig", aiconfig=aiconfig_ok).to_flask_format()
        case Err(e):
            return HttpResponseWithAIConfig(message=f"Failed to create AIConfig: {e}", code=400, aiconfig=None).to_flask_format()


@app.route("/api/run", methods=["POST"])
async def run() -> FlaskResponse:
    state = get_server_state(app)
    aiconfig = state.aiconfig
    request_json = request.get_json()

    _op = make_op_run_method(MethodName("run"))

    def _get_op_args():
        prompt_name = request_json.get("prompt_name", None)
        stream = request_json.get("stream", True)
        LOGGER.info(f"Running prompt: {prompt_name}, {stream=}")
        inference_options = InferenceOptions(stream=stream)
        return Ok(
            OpArgs(
                {
                    "prompt_name": prompt_name,
                    #
                    "options": inference_options,
                }
            )
        )

    op_args = _get_op_args()

    return run_aiconfig_operation_with_op_args(aiconfig, "run", _op, op_args)


@app.route("/api/add_prompt", methods=["POST"])
def add_prompt() -> FlaskResponse:
    method_name = MethodName("add_prompt")
    signature: dict[str, Type[Any]] = {"prompt_name": str, "prompt_data": Prompt}

    state = get_server_state(app)
    aiconfig = state.aiconfig
    request_json = request.get_json()

    operation = make_op_run_method(method_name)
    return run_aiconfig_operation_with_request_json(aiconfig, request_json, f"method_{method_name}", operation, signature)


@app.route("/api/update_prompt", methods=["POST"])
def update_prompt() -> FlaskResponse:
    method_name = MethodName("update_prompt")
    signature: dict[str, Type[Any]] = {"prompt_name": str, "prompt_data": Prompt}

    state = get_server_state(app)
    aiconfig = state.aiconfig
    request_json = request.get_json()

    operation = make_op_run_method(method_name)
    return run_aiconfig_operation_with_request_json(aiconfig, request_json, f"method_{method_name}", operation, signature)


@app.route("/api/delete_prompt", methods=["POST"])
def delete_prompt() -> FlaskResponse:
    method_name = MethodName("delete_prompt")
    signature: dict[str, Type[Any]] = {"prompt_name": str}

    state = get_server_state(app)
    aiconfig = state.aiconfig
    request_json = request.get_json()

    operation = make_op_run_method(method_name)
    return run_aiconfig_operation_with_request_json(aiconfig, request_json, f"method_{method_name}", operation, signature)
