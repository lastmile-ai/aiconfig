import asyncio
import copy
import ctypes
import json
import copy
import logging
import threading
import time
import webbrowser
import uuid
from typing import Any, Dict, Type, Union

import lastmile_utils.lib.core.api as core_utils
import result
from aiconfig.Config import AIConfigRuntime
from aiconfig.editor.server.queue_iterator import STOP_STREAMING_SIGNAL, QueueIterator
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
from aiconfig.registry import ModelParserRegistry
from flask import Flask, Response, request, stream_with_context
from flask_cors import CORS
from result import Err, Ok, Result

from aiconfig.schema import ExecuteResult, Output, Prompt

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
    try:
        LOGGER.info(f"Opening browser at http://localhost:{edit_config.server_port}")
        webbrowser.open(f"http://localhost:{edit_config.server_port}")
    except Exception as e:
        LOGGER.warning(f"Failed to open browser: {e}. Please open http://localhost:{port} manually.")

    app.server_state = ServerState()  # type: ignore
    res_server_state_init = init_server_state(app, edit_config)
    match res_server_state_init:
        case Ok(_):
            LOGGER.info("Initialized server state")
            debug = edit_config.server_mode in [ServerMode.DEBUG_BACKEND, ServerMode.DEBUG_SERVERS]
            LOGGER.info(f"Running in {edit_config.server_mode} mode")
            app.run(port=edit_config.server_port, debug=debug, use_reloader=debug)
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


@app.route("/api/server_status", methods=["GET"])
def server_status() -> FlaskResponse:
    return FlaskResponse(({"status": "OK"}, 200))


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
def run() -> FlaskResponse:
    EXCLUDE_OPTIONS = {
        "prompt_index": True,
        "file_path": True,
        "callback_manager": True,
    }
    state = get_server_state(app)
    aiconfig = state.aiconfig
    request_json = request.get_json()
    cancellation_token_id: str | None = None
    aiconfig_deep_copy: AIConfigRuntime | None = None

    cancellation_token_id = request_json.get("cancellation_token_id")
    if not cancellation_token_id:
        cancellation_token_id = str(uuid.uuid4())

    prompt_name: str | None = request_json.get("prompt_name")
    if prompt_name is None:
        return HttpResponseWithAIConfig(
            message="No prompt name provided, cannot execute `run` command",
            code=400,
            aiconfig=None,
        ).to_flask_format()

    # TODO (rossdanlm): Refactor aiconfig.run() to not take in `params`
    # as a function arg since we can now just call
    # aiconfig.get_parameters(prompt_name) directly inside of run. See:
    # https://github.com/lastmile-ai/aiconfig/issues/671
    params = request_json.get("params", aiconfig.get_parameters(prompt_name))  # type: ignore
    stream = request_json.get("stream", True)

    # Define stream callback and queue object for streaming results
    output_text_queue = QueueIterator()

    def update_output_queue(data: str, _accumulated_data: str, _index: int) -> None:
        should_end_stream: bool = data == STOP_STREAMING_SIGNAL
        output_text_queue.put(data, should_end_stream)

    inference_options = InferenceOptions(
        stream=stream,
        stream_callback=update_output_queue,
    )

    # Deepcopy the aiconfig prior to run so we can restore it in the case the run operation is cancelled or encounters some error
    aiconfig_deep_copy = copy.deepcopy(aiconfig)

    state.events[cancellation_token_id] = threading.Event()

    def generate(cancellation_token_id: str):  # type: ignore
        # Use multi-threading so that we don't block run command from
        # displaying the streamed output (if streaming is supported)
        def run_async_config_in_thread():
            asyncio.run(aiconfig.run(prompt_name=prompt_name, params=params, run_with_dependencies=False, options=inference_options))  # type: ignore
            output_text_queue.put(STOP_STREAMING_SIGNAL)  # type: ignore

        def create_cancellation_payload():
            aiconfig_json = aiconfig_deep_copy.model_dump(exclude=EXCLUDE_OPTIONS) if aiconfig_deep_copy is not None else None
            return json.dumps({"error": {"message": "The task was cancelled.", "code": 499, "data": aiconfig_json}})

        def handle_cancellation():
            yield "["
            yield create_cancellation_payload()
            yield "]"

            # Reset the aiconfig state to the state prior to the run, and kill the running thread
            kill_thread(t.ident)
            state.aiconfig = aiconfig_deep_copy

        def kill_thread(thread_id: int | None):
            """
            Kill the thread with the given thread_id.

            PyThreadState_SetAsyncExc: This is a C API function in Python which is used to raise an exception in the context
            of the specified thread.

            SystemExit: This is the exception we'd like to raise in the target thread.
            """
            if thread_id is None:
                # Nothing to do
                return

            response = ctypes.pythonapi.PyThreadState_SetAsyncExc(ctypes.c_long(thread_id), ctypes.py_object(SystemExit))

            if response == 0:
                print(f"Invalid thread id {thread_id}")
            elif response != 1:
                # If the response is not 1, the function didn't work correctly, and you should call it again with exc=NULL to reset it.
                ctypes.pythonapi.PyThreadState_SetAsyncExc(thread_id, None)

        cancellation_event = state.events[cancellation_token_id]

        t = threading.Thread(target=run_async_config_in_thread)
        t.start()

        # Create a deep copy of the state aiconfig so we can yield an AIConfig
        # with streaming partial outputs in the meantime. This probably isn't
        # necessary, but just getting unblocked for now
        displaying_config = copy.deepcopy(aiconfig)

        # If model supports streaming, need to wait until streamer has at
        # least 1 item to display. If model does not support streaming,
        # need to wait until the aiconfig.run() thread is complete
        SLEEP_DELAY_SECONDS = 0.1
        wait_time_in_seconds = 0.0
        while output_text_queue.isEmpty() and t.is_alive():
            if cancellation_event.is_set():
                yield from handle_cancellation()
                return

            # Yea I know time.sleep() isn't super accurate, but it's fine,
            # we can fix later
            time.sleep(0.1)
            wait_time_in_seconds += SLEEP_DELAY_SECONDS
            print(f"Output queue is currently empty. Waiting for {wait_time_in_seconds:.1f}s...")

        # Yield in flask is weird and you either need to send responses as a
        # string, or artificially wrap them around "[" and "]"
        # yield "["
        if not output_text_queue.isEmpty():
            accumulated_output_text = ""
            for text in output_text_queue:
                if cancellation_event.is_set():
                    yield from handle_cancellation()
                    return

                if isinstance(text, str):
                    accumulated_output_text += text
                elif isinstance(text, dict) and "content" in text:
                    # TODO: Fix streaming output format so that it returns text
                    accumulated_output_text += text["content"]
                elif isinstance(text, dict) and "generated_text" in text:
                    # TODO: Fix streaming output format so that it returns text
                    accumulated_output_text += text["generated_text"]

                accumulated_output: Output = ExecuteResult(
                    **{
                        "output_type": "execute_result",
                        "data": accumulated_output_text,
                        # Assume streaming only supports single output
                        # I think this actually may be wrong for PaLM or OpenAI
                        # TODO: Need to sync with Ankush but can fix forward
                        "execution_count": 0,
                        "metadata": {},
                    }  # type: ignore
                )

                displaying_config.add_output(prompt_name, accumulated_output, overwrite=True)
                aiconfig_json = displaying_config.model_dump(exclude=EXCLUDE_OPTIONS)
                yield "["
                yield json.dumps({"aiconfig": aiconfig_json})
                yield "]"

        # Ensure that the run process is complete to yield final output
        t.join()

        if cancellation_event.is_set():
            yield from handle_cancellation()
            return
        else:
            state.events.pop(cancellation_token_id, None)

            aiconfig_json = aiconfig.model_dump(exclude=EXCLUDE_OPTIONS) if aiconfig is not None else None
            yield "["
            yield json.dumps({"aiconfig_complete": aiconfig_json})
            yield "]"

    try:
        LOGGER.info(f"Running `aiconfig.run()` command with request: {request_json}")
        # Note; We run the streaming API even for non-streaming runs so that
        # we can unify the way we process data on the client
        # Streaming based on
        # https://stackoverflow.com/questions/73275517/flask-not-streaming-json-response
        return Response(
            stream_with_context(generate(cancellation_token_id)),
            status=200,
            content_type="application/json",
        )  # type: ignore
    except Exception as e:
        return HttpResponseWithAIConfig(
            #
            message=f"Failed to run prompt: {type(e)}, {e}",
            code=400,
            aiconfig=None,
        ).to_flask_format()


@app.route("/api/cancel", methods=["POST"])
def cancel() -> FlaskResponse:
    state = get_server_state(app)
    request_json = request.get_json()

    cancellation_token_id: str | None = request_json.get("cancellation_token_id")
    if cancellation_token_id is not None:
        event = state.events.get(cancellation_token_id)
        if event is not None:
            event.set()
            # Remove the event from the events dict
            state.events.pop(cancellation_token_id)

            return FlaskResponse(({"cancellation_token_id": cancellation_token_id}, 200))
        else:
            # Return a 422 Unprocessable Entity
            return FlaskResponse(
                (
                    {
                        "cancellation_token_id": cancellation_token_id,
                        "message": "Unable to process cancellation request. Task not found for assosiated cancellation_token_id",
                    },
                    422,
                )
            )
    else:
        # Return a 400 Bad Request
        return FlaskResponse(
            (
                {
                    "message": "No cancellation_token_id was specified in the request. Unable to process cancellation.",
                },
                400,
            )
        )


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


@app.route("/api/update_model", methods=["POST"])
def update_model() -> FlaskResponse:
    state = get_server_state(app)
    aiconfig = state.aiconfig
    request_json = request.get_json()

    model_name: str | None = request_json.get("model_name")
    settings: Dict[str, Any] | None = request_json.get("settings")
    prompt_name: str | None = request_json.get("prompt_name")

    operation = make_op_run_method(MethodName("update_model"))
    operation_args: Result[OpArgs, str] = result.Ok(OpArgs({"model_name": model_name, "settings": settings, "prompt_name": prompt_name}))
    return run_aiconfig_operation_with_op_args(aiconfig, "update_model", operation, operation_args)


@app.route("/api/set_parameter", methods=["POST"])
def set_parameter() -> FlaskResponse:
    state = get_server_state(app)
    aiconfig = state.aiconfig
    request_json = request.get_json()

    parameter_name: str | None = request_json.get("parameter_name")
    parameter_value: Union[str, Dict[str, Any]] | None = request_json.get("parameter_value")
    prompt_name: str | None = request_json.get("prompt_name")

    operation = make_op_run_method(MethodName("set_parameter"))
    operation_args: Result[OpArgs, str] = result.Ok(
        OpArgs({"parameter_name": parameter_name, "parameter_value": parameter_value, "prompt_name": prompt_name})
    )
    return run_aiconfig_operation_with_op_args(aiconfig, "set_parameter", operation, operation_args)


@app.route("/api/set_parameters", methods=["POST"])
def set_parameters() -> FlaskResponse:
    state = get_server_state(app)
    aiconfig = state.aiconfig
    request_json = request.get_json()

    parameters: Dict[str, Any] = request_json.get("parameters")
    prompt_name: str | None = request_json.get("prompt_name")

    operation = make_op_run_method(MethodName("set_parameters"))
    operation_args: Result[OpArgs, str] = result.Ok(OpArgs({"parameters": parameters, "prompt_name": prompt_name}))
    return run_aiconfig_operation_with_op_args(aiconfig, "set_parameters", operation, operation_args)


@app.route("/api/delete_parameter", methods=["POST"])
def delete_parameter() -> FlaskResponse:
    state = get_server_state(app)
    aiconfig = state.aiconfig
    request_json = request.get_json()

    parameter_name: str | None = request_json.get("parameter_name")
    prompt_name: str | None = request_json.get("prompt_name")

    operation = make_op_run_method(MethodName("delete_parameter"))
    operation_args: Result[OpArgs, str] = result.Ok(OpArgs({"parameter_name": parameter_name, "prompt_name": prompt_name}))
    return run_aiconfig_operation_with_op_args(aiconfig, "delete_parameter", operation, operation_args)


@app.route("/api/set_name", methods=["POST"])
def set_name() -> FlaskResponse:
    state = get_server_state(app)
    aiconfig = state.aiconfig
    request_json = request.get_json()

    name: str | None = request_json.get("name")

    operation = make_op_run_method(MethodName("set_name"))
    operation_args: Result[OpArgs, str] = result.Ok(OpArgs({"name": name}))
    return run_aiconfig_operation_with_op_args(aiconfig, "set_name", operation, operation_args)


@app.route("/api/set_description", methods=["POST"])
def set_description() -> FlaskResponse:
    state = get_server_state(app)
    aiconfig = state.aiconfig
    request_json = request.get_json()

    description: str | None = request_json.get("description")

    operation = make_op_run_method(MethodName("set_description"))
    operation_args: Result[OpArgs, str] = result.Ok(OpArgs({"description": description}))
    return run_aiconfig_operation_with_op_args(aiconfig, "set_description", operation, operation_args)


@app.route("/api/clear_outputs", methods=["POST"])
def clear_outputs() -> FlaskResponse:
    """
    Clears all outputs in the server state's AIConfig.
    """
    state = get_server_state(app)
    aiconfig = state.aiconfig
    request_json = request.get_json()

    if aiconfig is None:
        LOGGER.info("No AIConfig in memory, can't run clear outputs.")
        return HttpResponseWithAIConfig(
            message="No AIConfig in memory, can't run clear outputs.",
            code=400,
            aiconfig=None,
        ).to_flask_format()

    def _op(aiconfig_runtime: AIConfigRuntime, _op_args: OpArgs) -> Result[None, str]:
        for prompt in aiconfig_runtime.prompts:
            prompt_name = prompt.name
            # fn name `delete_output`` is misleading. TODO: Rename to `delete_outputs`` in AIConfig API
            aiconfig_runtime.delete_output(prompt_name)
        return Ok(None)

    signature: dict[str, Type[Any]] = {}
    return run_aiconfig_operation_with_request_json(aiconfig, request_json, f"method_", _op, signature)
