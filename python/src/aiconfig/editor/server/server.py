import logging

import lastmile_utils.lib.core.api as core_utils
import result
from aiconfig.Config import AIConfigRuntime
from aiconfig.editor.server.server_utils import (
    EditServerConfig,
    FlaskPostResponse,
    HttpPostResponse,
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
from result import Err, Ok, Result

logging.getLogger("werkzeug").disabled = True

logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)

log_handler = logging.FileHandler("editor_flask_server.log", mode="a")
formatter = logging.Formatter(core_utils.LOGGER_FMT)
log_handler.setFormatter(formatter)

LOGGER.addHandler(log_handler)


app = Flask(__name__, static_url_path="")


def _validated_request_path(allow_create: bool = False) -> Result[ValidatedPath, str]:
    request_json = request.get_json()
    path = request_json.get("path", None)
    return get_validated_path(path, allow_create=allow_create)


@app.route("/")
def home():
    return app.send_static_file("index.html")


@app.route("/api/load_model_parser_module", methods=["POST"])
def load_model_parser_module() -> FlaskPostResponse:
    path = _validated_request_path()

    def _to_flask(resp: HttpPostResponse) -> FlaskPostResponse:
        return resp.to_flask_format()

    res_response = path.map(get_http_response_load_user_parser_module).map(_to_flask)
    return res_response.unwrap_or(
        HttpPostResponse(
            message="Failed to load model parser module",
            code=400,
            aiconfig=None
            #
        ).to_flask_format()
    )


@app.route("/api/load", methods=["POST"])
def load() -> FlaskPostResponse:
    state = get_server_state(app)

    path_val = _validated_request_path()
    res_aiconfig = path_val.and_then(safe_load_from_disk)
    match res_aiconfig:
        case Ok(aiconfig):
            LOGGER.warning(f"Loaded AIConfig from {path_val}. This may have overwritten in-memory changes.")
            state.aiconfig = aiconfig
            return HttpPostResponse(message="Loaded", aiconfig=aiconfig).to_flask_format()
        case Err(e):
            return HttpPostResponse(message=f"Failed to load AIConfig: {path_val}, {e}", code=400, aiconfig=None).to_flask_format()


@app.route("/api/save", methods=["POST"])
def save() -> FlaskPostResponse:
    state = get_server_state(app)
    if state.aiconfig is None:
        return HttpPostResponse(message="No AIConfig in memory, nothing to save.", code=400, aiconfig=None).to_flask_format()
    else:
        aiconfig: AIConfigRuntime = state.aiconfig

        path_val = _validated_request_path(allow_create=True)
        res_save: Result[HttpPostResponse, str] = result.do(
            Ok(HttpPostResponse(message="Saved to disk", aiconfig=aiconfig))
            for path_val_ok in path_val
            for _ in safe_save_to_disk(aiconfig, path_val_ok)
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
    state = get_server_state(app)
    state.aiconfig = AIConfigRuntime.create()  # type: ignore
    return HttpPostResponse(message="Created new AIConfig", aiconfig=state.aiconfig).to_flask_format()


@app.route("/api/run", methods=["POST"])
async def run() -> FlaskPostResponse:
    state = get_server_state(app)
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
    state = get_server_state(app)
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
