## SECTION: Imports and Constants

import logging
import os
from contextlib import asynccontextmanager
from typing import cast
import webbrowser

import lastmile_utils.lib.core.api as core_utils
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from hypercorn.asyncio import serve  # type: ignore
from hypercorn.config import Config
from hypercorn.typing import ASGIFramework
from result import Err, Ok, Result
import result

from aiconfig.editor.server import server_v2_utils as server_utils
import aiconfig.editor.server.server_v2_common as server_common
import aiconfig.editor.server.server_v2_operation_lib as operation_lib


THIS_DIR = os.path.dirname(os.path.realpath(__file__))
STATIC_DIR = os.path.join(THIS_DIR, "static")

DEFAULT_PORT = 8080

logger: logging.Logger = core_utils.get_logger(__name__, log_file_path="editor_server_v2.log")


## SECTION: Global state initialization


global_state = server_common.GlobalState(
    editor_config=server_common.EditServerConfig(),
    active_instances=dict(),
)


async def _run_websocket_connection(initial_loop_state: server_utils.LoopState, websocket: WebSocket) -> Result[str, str]:
    """This is the main websocket loop."""
    loop_state = initial_loop_state
    instance_state = loop_state.instance_state
    instance_id = instance_state.instance_id
    global global_state
    global_state.active_instances[instance_id] = server_common.ConnectionState(websocket=websocket)

    logger.info("Starting websocket loop")
    logger.info(f"{instance_state.aiconfig_path=}")
    while True:
        logger.debug(f"{loop_state.operation_task=}, {loop_state.recv_task=}")
        try:
            res_handle = await server_utils.handle_websocket_loop_iteration(loop_state, websocket)
            match res_handle:
                case Ok((response, new_loop_state)):
                    loop_state = new_loop_state
                    if response:
                        await websocket.send_text(response.serialize())
                case Err(e):
                    logger.critical(f"Can't generate response or update loop state.\n{e}")
                    return await _cleanup_websocket_connection(instance_state.instance_id, global_state.active_instances[instance_state.instance_id])
        except (WebSocketDisconnect, RuntimeError) as e:
            ewt = core_utils.ErrWithTraceback(e)
            logger.error(f"Websocket loop terminated: {e}, {ewt}")
            return await _cleanup_websocket_connection(instance_state.instance_id, global_state.active_instances[instance_state.instance_id])


@asynccontextmanager
async def _app_lifespan(app: FastAPI):
    global global_state
    logger.info("Start lifespan")
    yield
    logger.info("Shutting down app.")
    cleanup_res_list = [
        await _cleanup_websocket_connection(instance_id, websocket_state) for instance_id, websocket_state in global_state.active_instances.items()
    ]
    cleanup_ok, cleanup_err = core_utils.result_reduce_list_separate(cleanup_res_list)
    logger.info("Cleaned up websockets. %s", cleanup_ok)
    if len(cleanup_err) > 0:
        logger.error("Failed to clean up websockets. %s", cleanup_err)
    del global_state


app = FastAPI(lifespan=_app_lifespan)


## SECTION: Programmatic Server API (run entrypoint)


async def run_backend_server(edit_config: server_common.EditServerConfig) -> Result[str, str]:
    global global_state
    global_state.editor_config = edit_config
    global logger
    logger = core_utils.get_logger(__name__, log_file_path="editor_server_v2.log", log_level=edit_config.log_level)

    await _init_app_state(app, edit_config)

    def _outcome_to_str(outcome: server_common.ServerBindOutcome) -> Result[str, str]:
        match outcome:
            case server_common.ServerBindOutcome.SUCCESS:
                return Ok(f"Server running on port {edit_config.server_port}")
            case server_common.ServerBindOutcome.PORT_IN_USE:
                return Err(f"Port {edit_config.server_port} in use")
            case server_common.ServerBindOutcome.OTHER_FAILURE:
                return Err(f"Failed to run server on port {edit_config.server_port}")

    if edit_config.server_mode != server_common.ServerMode.DEBUG_BACKEND:
        try:
            logger.info(f"Opening browser at http://localhost:{edit_config.server_port}")
            webbrowser.open(f"http://localhost:{edit_config.server_port}")
        except Exception as e:
            logger.warning(f"Failed to open browser: {e}. Please open http://localhost:{edit_config.server_port} manually.")

    match edit_config.server_port:
        case int():
            result = await _run_backend_server_on_port(edit_config.log_level, edit_config.server_port)
            return _outcome_to_str(result)
        case None:
            port_try = DEFAULT_PORT
            max_port = 65535
            while port_try < max_port:
                backend_res_on_port = await _run_backend_server_on_port(edit_config.log_level, port_try)
                logger.debug(f"{backend_res_on_port=}")
                match backend_res_on_port:
                    case server_common.ServerBindOutcome.PORT_IN_USE:
                        logger.info("Going to try next port...")
                        port_try += 1
                        continue
                    case _:
                        return _outcome_to_str(backend_res_on_port)

            return Err(f"Failed to run backend server on any port in range {DEFAULT_PORT} to {max_port}")


async def _run_backend_server_on_port(log_level: str | int, port: int) -> server_common.ServerBindOutcome:
    logger.info(f"Running backend server on port {port}")

    log_level_for_hypercorn = (
        #
        log_level.upper()
        if isinstance(log_level, str)
        else logging.getLevelName(log_level)
    )
    fastapi_app: ASGIFramework = cast(ASGIFramework, app)
    try:
        logger.info(f"Starting server on port {port}")
        await serve(
            fastapi_app,
            Config.from_mapping(
                #
                _bind=[f"localhost:{port}"],
                loglevel=log_level_for_hypercorn,
                use_reloader=True,
                keep_alive_timeout=365 * 24 * 3600,
            ),
        )
        logger.info(f"Done running server on port {port}")
        return server_common.ServerBindOutcome.SUCCESS
    except OSError as e_os:
        logger.warning(f"Port in use: {port}: {e_os}")
        return server_common.ServerBindOutcome.PORT_IN_USE
    except Exception as e:
        logger.error(f"Failed to run backend server on port {port}: {type(e)}")
        logger.error(core_utils.ErrWithTraceback(e))
        return server_common.ServerBindOutcome.OTHER_FAILURE


## SECTION: Web API. HTTP endpoints: static files, root, and websocket connect


@app.get("/")
def home():
    logger.info(f"ROOT, {os.getcwd()}")
    index_path = os.path.join(STATIC_DIR, "index.html")
    res_index = core_utils.read_text_file(index_path)
    match res_index:
        case Ok(index):
            return HTMLResponse(index)
        case Err(e):
            logger.error(f"Failed to load index.html: {e}")
            return HTMLResponse(f"<h1>Failed to load index.html: {e}</h1>")


@app.get("/api/server_status")
def server_status():
    data = {"status": "OK"}
    return JSONResponse(content=data, status_code=200)


@app.websocket("/ws_manage_aiconfig_instance")
async def accept_and_run_websocket(websocket: WebSocket):
    logger.info("Accepting websocket connection")
    await websocket.accept()
    global global_state

    initial_loop_state = await server_utils.LoopState.new(websocket, global_state.editor_config)
    res_websocket: Result[str, str] = await result.do_async(
        await _run_websocket_connection(initial_loop_state_ok, websocket)
        #
        for initial_loop_state_ok in initial_loop_state
    )
    logger.info(f"{res_websocket=}")
    match res_websocket:
        case Ok(result_):
            return JSONResponse(content=result_, status_code=200)
        case Err(e):
            return JSONResponse(content=f"Failed to run websocket: {e}", status_code=500)


## SECTION: Global state management


async def _init_app_state(app: FastAPI, edit_config: server_common.EditServerConfig):
    logger.setLevel(edit_config.log_level)
    logger.info("Edit config: %s", edit_config.model_dump_json())

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.mount("/static", StaticFiles(directory=os.path.join(STATIC_DIR, "static")), name="static")

    res_load_module = await (
        server_common.get_validated_path(edit_config.parsers_module_path)
        #
        .and_then_async(operation_lib.load_user_parser_module)
    )
    match res_load_module:
        case Ok(_module):
            logger.info(f"Loaded module {edit_config.parsers_module_path}, output: {_module}")
        case Err(e):
            logger.warning(f"Failed to load module {edit_config.parsers_module_path}: {e}")


async def _cleanup_websocket_connection(instance_id: str, websocket_state: server_common.ConnectionState) -> Result[str, str]:
    logger.info(f"Closing websocket connection for instance {websocket_state}")
    try:
        await websocket_state.websocket.close()
        return Ok(f"Closed websocket connection for instance {instance_id}")
    except Exception as e:
        return Err(f"Failed to close websocket connection for instance {instance_id}: {e}")
