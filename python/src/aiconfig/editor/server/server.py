import asyncio
import copy
import json
import logging
from typing import Any, Type

import lastmile_utils.lib.core.api as core_utils
import result
import threading
import time
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
from aiconfig.editor.server.queue_iterator import (
    QueueIterator,
    STOP_STREAMING_SIGNAL,
)
from aiconfig.model_parser import InferenceOptions
from aiconfig.registry import ModelParserRegistry
from aiconfig.schema import ExecuteResult, Prompt, Output
from flask import Flask, Response, request, stream_with_context
from flask_cors import CORS
from result import Err, Ok, Result


logging.getLogger("werkzeug").disabled = True

logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)

log_handler = logging.FileHandler("editor_flask_server.log", mode="a")
formatter = logging.Formatter(core_utils.LOGGER_FMT)
log_handler.setFormatter(formatter)

LOGGER.addHandler(log_handler)


app = Flask(__name__, static_url_path="")
CORS(app, resources={r"/api/*": {"origins": "*"}})


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
    if "path" not in request_json or not isinstance(request_json["path"], str):
        return Err("Request JSON must contain a 'path' field with a string value.")
    else:
        return get_validated_path(request_json["path"], allow_create=allow_create)


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
    if not request_json.keys() <= {"path"}:
        return HttpResponseWithAIConfig(
            message="Request JSON must contain a 'path' field with a string value, or no arguments.", code=400, aiconfig=None
        ).to_flask_format()
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
    path: str | None = request_json.get("path", None)

    if path is None:
        if aiconfig is None:
            return HttpResponseWithAIConfig(message="No AIConfig loaded", code=400, aiconfig=None).to_flask_format()
        else:
            path = aiconfig.file_path

    res_path_val = get_validated_path(path, allow_create=True)
    match res_path_val:
        case Ok(path_ok):
            _op = make_op_run_method(MethodName("save"))
            op_args: Result[OpArgs, str] = result.Ok(OpArgs({"config_filepath": path_ok}))
            return run_aiconfig_operation_with_op_args(aiconfig, "save", _op, op_args)

        case Err(e):
            return HttpResponseWithAIConfig(message=f"Failed to save AIConfig: {e}", code=400, aiconfig=None).to_flask_format()


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
def run():
    EXCLUDE_OPTIONS = {
        "prompt_index": True,
        "file_path": True,
        "callback_manager": True,
    }
    state = get_server_state(app)
    aiconfig = state.aiconfig
    request_json = request.get_json()
    prompt_name: str = request_json.get("prompt_name", "get_activities") # Hard-coded
    params = request_json.get("params", {}) #Fixed in https://github.com/lastmile-ai/aiconfig/pull/668
    stream = request_json.get("stream", True)

    # Define stream callback and queue object for streaming results
    output_text_queue = QueueIterator()
    def update_output_queue(data, _accumulated_data, _index) -> None:
        should_end_stream = data == STOP_STREAMING_SIGNAL
        output_text_queue.put(data, should_end_stream)
    inference_options = InferenceOptions(
        stream=stream,
        stream_callback=update_output_queue,
    )

    def generate():
        # Use multi-threading so that we don't block run command from
        # displaying the streamed output (if streaming is supported)
        def run_async_config_in_thread():
            asyncio.run(aiconfig.run(
                    prompt_name=prompt_name,
                    params=params,
                    run_with_dependencies=False,
                    options=inference_options,
                )
            )
            output_text_queue.put(STOP_STREAMING_SIGNAL)
        t = threading.Thread(target=run_async_config_in_thread)
        t.start()

        # Create a deep copy of the state aiconfig so we can yield an AIConfig
        # with streaming partial outputs in the meantime. This probably isn't
        # necessary, but just getting unblocked for now
        displaying_config = copy.deepcopy(aiconfig)

        # Need to wait until streamer has at least 1 item to display
        SLEEP_DELAY_SECONDS = 0.1
        MAX_TIMEOUT_SECONDS = 5.0
        wait_time_in_seconds = 0.0
        while output_text_queue.isEmpty():
            time.sleep(0.1)
            wait_time_in_seconds += SLEEP_DELAY_SECONDS
            print(f"Output queue is currently empty. Waiting for {wait_time_in_seconds:.1f}s...")

            # TODO: We should have a better way to check if the model supports
            # streaming or not and bypass this if they do. I'm thinking we
            # could add an abstract field that all models need to set T/F
            # but we'll see. For now this works
            # And yea I know time.sleep() isn't super accurate, but it's fine,
            # we can fix later
            if wait_time_in_seconds >= MAX_TIMEOUT_SECONDS:
                print(f"Output queue is still empty after {wait_time_in_seconds:.1f}s. Breaking...")
                break

        yield "["
        aiconfig_json: str | None = None
        if not output_text_queue.isEmpty():
            accumulated_output_text = ""
            for text in output_text_queue:
                if isinstance(text, str):
                    accumulated_output_text += text
                elif isinstance(text, dict) and "content" in text:
                    # TODO: Fix streaming output format so that it returns text
                    accumulated_output_text += text["content"]

                accumulated_output : Output = ExecuteResult(
                    **{
                        "output_type": "execute_result",
                        "data": accumulated_output_text,
                        # Assume streaming only supports single output
                        # I think this actually may be wrong for PaLM or OpenAI
                        # TODO: Need to sync with Ankush but can fix forward
                        "execution_count": 0, 
                        "metadata": {},
                    }
                )

                displaying_config.add_output(prompt_name, accumulated_output, overwrite=True)
                aiconfig_json = displaying_config.model_dump(exclude=EXCLUDE_OPTIONS)
                yield json.dumps({"aiconfig": aiconfig_json})

        # Some models don't support streaming, so we need to wait for run
        # process to complete and yield the final output
        t.join()
        if aiconfig_json is None:
            aiconfig_json = aiconfig.model_dump(exclude=EXCLUDE_OPTIONS)
        yield json.dumps({"aiconfig": aiconfig_json})
        yield "]"

    try:
        LOGGER.info(f"Running `aiconfig.run()` command with request: {request_json}")
        # Streaming based on
        # https://stackoverflow.com/questions/73275517/flask-not-streaming-json-response
        return Response(
            stream_with_context(generate()),
            status=200,
            content_type="application/json",
        )
    except Exception as e:
        return HttpResponseWithAIConfig(
            #
            message=f"Failed to run prompt: {type(e)}, {e}",
            code=400,
            aiconfig=None,
        ).to_flask_format()


@app.route("/api/add_prompt", methods=["POST"])
def add_prompt() -> FlaskResponse:
    method_name = MethodName("add_prompt")
    signature: dict[str, Type[Any]] = {"prompt_name": str, "prompt_data": Prompt, "index": int}

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
