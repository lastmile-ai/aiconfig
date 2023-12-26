import logging

import lastmile_utils.lib.core.api as core_utils
import result
from aiconfig.Config import AIConfigRuntime
from aiconfig.editor.server.server_utils import (
    EditServerConfig,
    FlaskResponse,
    HttpResponseWithAIConfig,
    ServerMode,
    ServerState,
    ValidatedPath,
    get_http_response_load_user_parser_module,
    get_server_state,
    get_validated_path,
    init_server_state,
    safe_load_from_disk,
    safe_save_to_disk,
)
from aiconfig.model_parser import InferenceOptions
from flask import Flask, request
from flask_cors import CORS # TODO: add this to requirements.txt
from result import Err, Ok, Result

from aiconfig.registry import ModelParserRegistry

logging.getLogger("werkzeug").disabled = True

logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)

log_handler = logging.FileHandler("editor_flask_server.log", mode="a")
formatter = logging.Formatter(core_utils.LOGGER_FMT)
log_handler.setFormatter(formatter)

LOGGER.addHandler(log_handler)


app = Flask(__name__, static_url_path="")
CORS(app, resources={r"/api/*": {"origins": "*"}})


def _validated_request_path(allow_create: bool = False) -> Result[ValidatedPath, str]:
    request_json = request.get_json()
    path = request_json.get("path", None)
    return get_validated_path(path, allow_create=allow_create)


@app.route("/")
def home():
    return app.send_static_file("index.html")


@app.route("/api/load_model_parser_module", methods=["POST"])
def load_model_parser_module() -> FlaskResponse:
    path = _validated_request_path()

    def _to_flask(resp: HttpResponseWithAIConfig) -> FlaskResponse:
        return resp.to_flask_format()

    res_response = path.map(get_http_response_load_user_parser_module).map(_to_flask)
    return res_response.unwrap_or(
        HttpResponseWithAIConfig(
            message="Failed to load model parser module",
            code=400,
            aiconfig=None
            #
        ).to_flask_format()
    )


@app.route("/api/load", methods=["POST"])
def load() -> FlaskResponse:
    state = get_server_state(app)

    path_val = _validated_request_path()
    res_aiconfig = path_val.and_then(safe_load_from_disk)
    match res_aiconfig:
        case Ok(aiconfig):
            LOGGER.warning(f"Loaded AIConfig from {path_val}. This may have overwritten in-memory changes.")
            state.aiconfig = aiconfig
            return HttpResponseWithAIConfig(message="Loaded", aiconfig=aiconfig).to_flask_format()
        case Err(e):
            return HttpResponseWithAIConfig(message=f"Failed to load AIConfig: {path_val}, {e}", code=400, aiconfig=None).to_flask_format()


@app.route("/api/save", methods=["POST"])
def save() -> FlaskResponse:
    state = get_server_state(app)
    if state.aiconfig is None:
        return HttpResponseWithAIConfig(message="No AIConfig in memory, nothing to save.", code=400, aiconfig=None).to_flask_format()
    else:
        aiconfig: AIConfigRuntime = state.aiconfig

        path_val = _validated_request_path(allow_create=True)
        res_save: Result[HttpResponseWithAIConfig, str] = result.do(
            Ok(HttpResponseWithAIConfig(message="Saved to disk", aiconfig=aiconfig))
            for path_val_ok in path_val
            for _ in safe_save_to_disk(aiconfig, path_val_ok)
        )
        return res_save.unwrap_or(
            HttpResponseWithAIConfig(
                #
                message="Failed to save to disk",
                code=400,
                aiconfig=None,
            )
        ).to_flask_format()


@app.route("/api/create", methods=["POST"])
def create() -> FlaskResponse:
    state = get_server_state(app)
    state.aiconfig = AIConfigRuntime.create()  # type: ignore
    return HttpResponseWithAIConfig(message="Created new AIConfig", aiconfig=state.aiconfig).to_flask_format()


@app.route("/api/run", methods=["POST"])
async def run() -> FlaskResponse:
    state = get_server_state(app)
    request_json = request.get_json()
    prompt_name : str = request_json.get("prompt_name", None)
    if prompt_name is None:
        return HttpResponseWithAIConfig(
            message="No prompt name provided, cannot execute `run` command",
            code=400,
            aiconfig=None,
        ).to_flask_format()
    params : str = request_json.get("params", None)
    stream : bool = request_json.get("stream", True)
    LOGGER.info(f"Running prompt: {prompt_name}, {stream=}")
    inference_options = InferenceOptions(stream=stream)
    try:
        result = await state.aiconfig.run( # type: ignore
            prompt_name,
            params,
            options=inference_options,
        ) 
        LOGGER.debug(f"Result: {result=}")
        return HttpResponseWithAIConfig(
            message="Done",
            aiconfig=state.aiconfig,
        ).to_flask_format()
    except Exception as e:
        err: Err[str] = core_utils.ErrWithTraceback(e)
        LOGGER.error(f"Failed to run: {err}")
        return HttpResponseWithAIConfig(
            message=f"Failed to run: {err}",
            code=400,
            aiconfig=None,
        ).to_flask_format()


@app.route("/api/add_prompt", methods=["POST"])
def add_prompt() -> FlaskResponse:
    state = get_server_state(app)
    request_json = request.get_json()
    try:
        LOGGER.info(f"Adding prompt: {request_json}")
        state.aiconfig.add_prompt(**request_json)  # type: ignore
        return HttpResponseWithAIConfig(
            message="Done",
            aiconfig=state.aiconfig,
        ).to_flask_format()
    except Exception as e:
        err: Err[str] = core_utils.ErrWithTraceback(e)
        LOGGER.error(f"Failed to add prompt: {err}")
        return HttpResponseWithAIConfig(
            message=f"Failed to add prompt: {err}",
            code=400,
            aiconfig=None,
        ).to_flask_format()

@app.route("/api/delete_prompt", methods=["POST"])
def delete_prompt() -> FlaskResponse:
    state = get_server_state(app)
    request_json = request.get_json()
    try:
        LOGGER.info(f"Deleting prompt: {request_json}")
        state.aiconfig.delete_prompt(**request_json)  # type: ignore
        return HttpResponseWithAIConfig(
            message="Done",
            aiconfig=state.aiconfig,
        ).to_flask_format()
    except Exception as e:
        err: Err[str] = core_utils.ErrWithTraceback(e)
        LOGGER.error(f"Failed to delete prompt: {err}")
        return HttpResponseWithAIConfig(
            message=f"Failed to delete prompt: {err}",
            code=400,
            aiconfig=None,
        ).to_flask_format()


@app.route("/api/list_models", methods=["GET"])
def list_models() -> FlaskResponse:
    out: list[str] = ModelParserRegistry.parser_ids()  # type: ignore
    json_obj = core_utils.JSONObject({"data": core_utils.JSONList(out)})
    return FlaskResponse((json_obj, 200))


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
