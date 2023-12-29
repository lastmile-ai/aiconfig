import json
import logging
import os
import uuid
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Literal, Tuple, TypeVar, Union
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware


import lastmile_utils.lib.core.api as core_utils
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import Field
from result import Err, Ok, Result

from aiconfig.Config import AIConfigRuntime
from aiconfig.editor.server import server_utils
from aiconfig.editor.server.server_utils import EditServerConfig
from aiconfig.model_parser import InferenceOptions
from aiconfig.registry import ModelParserRegistry
from aiconfig.schema import Prompt

logging.basicConfig(format=core_utils.LOGGER_FMT)

T_MethodOutput = TypeVar("T_MethodOutput")


class ConnectionState(core_utils.Record):
    aiconfig_instance: AIConfigRuntime | None
    aiconfig_path: server_utils.UnvalidatedPath | None = None


@dataclass
class WebSocketState:
    websocket: WebSocket
    connection_state: ConnectionState


@dataclass
class GlobalState:
    # TODO: is there a better way to pass this into websocket connections?
    editor_config: EditServerConfig
    active_websockets: dict[str, WebSocketState]


global_state = GlobalState(editor_config=EditServerConfig(), active_websockets=dict())

LOGGER = logging.getLogger(__name__)
log_handler = logging.FileHandler("editor_flask_server.log", mode="a")
formatter = logging.Formatter(core_utils.LOGGER_FMT)
log_handler.setFormatter(formatter)

LOGGER.addHandler(log_handler)


@asynccontextmanager
async def lifespan(_: FastAPI):
    global global_state
    _init_app_state(global_state.editor_config)
    LOGGER.info("Start lifespan")
    yield
    LOGGER.info("End lifespan")
    for instance_id in global_state.active_websockets.keys():
        await _cleanup_websocket_connection(global_state.active_websockets, instance_id)


app = FastAPI(lifespan=lifespan)  # type: ignore[fixme]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

THIS_DIR = os.path.dirname(os.path.realpath(__file__))
STATIC_DIR = os.path.join(THIS_DIR, "static")
app.mount("/static", StaticFiles(directory=os.path.join(STATIC_DIR, "static")), name="static")


@app.get("/")
def get():
    LOGGER.info(f"ROOT, {os.getcwd()}")
    index_path = os.path.join(STATIC_DIR, "index.html")
    res_index = core_utils.read_text_file(index_path)
    match res_index:
        case Ok(index):
            return HTMLResponse(index)
        case Err(e):
            return HTMLResponse(f"<h1>Failed to load index.html: {e}</h1>")


class LoadModelParserModule(core_utils.Record):
    command_name: Literal["load_model_parser_module"]
    path: server_utils.UnvalidatedPath


class ListModels(core_utils.Record):
    command_name: Literal["list_models"]


class Create(core_utils.Record):
    command_name: Literal["create"]


class Load(core_utils.Record):
    command_name: Literal["load"]
    path: server_utils.UnvalidatedPath | None = None


class Run(core_utils.Record):
    command_name: Literal["run"]
    prompt_name: str
    params: dict[str, Any] = Field(default_factory=dict)
    stream: bool = False


class AddPrompt(core_utils.Record):
    command_name: Literal["add_prompt"]
    prompt_name: str
    prompt_data: Prompt
    index: int


class UpdatePrompt(core_utils.Record):
    command_name: Literal["update_prompt"]
    prompt_name: str
    prompt_data: Prompt


class DeletePrompt(core_utils.Record):
    command_name: Literal["delete_prompt"]
    prompt_name: str


class Save(core_utils.Record):
    command_name: Literal["save"]
    path: server_utils.UnvalidatedPath


class Command(core_utils.Record):
    command: Union[
        LoadModelParserModule,
        ListModels,
        Create,
        Load,
        Run,
        AddPrompt,
        UpdatePrompt,
        DeletePrompt,
        Save,
    ] = Field(..., discriminator="command_name")


T_Command = TypeVar(
    "T_Command",
    LoadModelParserModule,
    ListModels,
    Create,
    Load,
    Run,
    AddPrompt,
    UpdatePrompt,
    DeletePrompt,
    Save,
)


def _aiconfig_to_json(aiconfig_instance: AIConfigRuntime | None) -> core_utils.JSONObject | None:
    if aiconfig_instance is None:
        return None
    else:
        EXCLUDE_OPTIONS = {
            "prompt_index": True,
            "file_path": True,
            "callback_manager": True,
        }
        return aiconfig_instance.model_dump(exclude=EXCLUDE_OPTIONS)


class CommandOutput(core_utils.Record):
    instance_id: str
    message: str
    is_success: bool
    aiconfig_instance: AIConfigRuntime | None
    # TODO: make this a more constrained type
    data: Any | None = None

    @staticmethod
    def from_method_output(instance_id: str, aiconfig_instance: AIConfigRuntime, message: str, method_output: Result[Any, str]) -> "CommandOutput":
        match method_output:
            case Ok(output_ok):
                out = CommandOutput(
                    instance_id=instance_id,
                    message=message,
                    is_success=True,
                    aiconfig_instance=aiconfig_instance,
                    data={"output": str(output_ok)},
                )
                LOGGER.info(f"{out.instance_id=}, {out.message=}")
                return out
            case Err(e):
                LOGGER.error(f"{e=}")
                return CommandOutput(
                    instance_id=instance_id,
                    message=f"Failed to run prompt: {e}",
                    is_success=False,
                    aiconfig_instance=aiconfig_instance,
                )

    def to_json(self) -> core_utils.JSONObject:
        return core_utils.JSONObject(
            {
                "instance_id": self.instance_id,
                "message": self.message,
                "is_success": self.is_success,
                "data": self.data,
                "aiconfig": _aiconfig_to_json(self.aiconfig_instance),
            }
        )


def _safe_run_aiconfig_method_v2(
    run_with_loaded_unsafe: Callable[[AIConfigRuntime, T_Command], Awaitable[T_MethodOutput]]
) -> Callable[[AIConfigRuntime, T_Command], Awaitable[Result[T_MethodOutput, str]]]:
    async def _fn(aiconfig_instance: AIConfigRuntime, inputs: T_Command) -> Result[T_MethodOutput, str]:
        try:
            out = Ok(await run_with_loaded_unsafe(aiconfig_instance, inputs))
            LOGGER.info(f"Ran command, output: {out}")
            return out
        except Exception as e:
            LOGGER.error(f"Failed to run command: {e}")
            return Err(f"Failed to run command: {e}")

    return _fn


def _command_input_to_output(
    run_method_fn: Callable[[AIConfigRuntime, T_Command], Awaitable[T_MethodOutput]]  # type: ignore[fixme]
) -> Callable[[str, AIConfigRuntime | None, T_Command], Awaitable[CommandOutput]]:
    """Decorator to make a function:
    (a) robust to exceptions,
    (b) able to accept None for the AIConfig instance, and
    (c) Convert an arbitrary output into a (standard) CommandOutput.

    The input function takes an AIConfigRuntime instance and one of the Command subtypes
    and returns some value depending on which command was run.

    The output (decorated) function does essentially the same thing, but with the properties listed above.
    The output function also automatically accepts the instance_id, which maps 1:1 with the aiconfig,
    and bundles it into the command output.

    See `_run_add_prompt() for example`.

    """
    run_safe = _safe_run_aiconfig_method_v2(run_method_fn)

    async def _new_fn(instance_id: str, aiconfig_instance: AIConfigRuntime | None, inputs: T_Command) -> CommandOutput:
        if aiconfig_instance is None:
            LOGGER.warning(f"No AIConfig loaded")
            return CommandOutput(
                instance_id=instance_id,
                message="No AIConfig loaded",
                is_success=False,
                aiconfig_instance=None,
            )
        else:
            method_output = await run_safe(aiconfig_instance, inputs)
            LOGGER.info(f"Ran command: {inputs}")
            out = CommandOutput.from_method_output(instance_id, aiconfig_instance, f"Ran command: {inputs}", method_output)
            LOGGER.info(f"{out.instance_id=}, {out.message=}")
            return out

    return _new_fn


@_command_input_to_output
async def _run_run(aiconfig_instance: AIConfigRuntime, inputs: Run) -> None:
    return await aiconfig_instance.run(inputs.prompt_name, inputs.params, InferenceOptions(stream=inputs.stream))  #  type: ignore


@_command_input_to_output
async def _run_add_prompt(aiconfig_instance: AIConfigRuntime, inputs: AddPrompt) -> None:
    return aiconfig_instance.add_prompt(inputs.prompt_name, inputs.prompt_data, inputs.index)


@_command_input_to_output
async def _run_update_prompt(aiconfig_instance: AIConfigRuntime, inputs: UpdatePrompt) -> None:
    return aiconfig_instance.update_prompt(inputs.prompt_name, inputs.prompt_data)


@_command_input_to_output
async def _run_delete_prompt(aiconfig_instance: AIConfigRuntime, inputs: DeletePrompt) -> None:
    return aiconfig_instance.delete_prompt(inputs.prompt_name)


@_command_input_to_output
async def _run_save(aiconfig_instance: AIConfigRuntime, inputs: Save) -> None:
    return aiconfig_instance.save(inputs.path)


async def _run_command(command: Command, aiconfig_instance: AIConfigRuntime | None, instance_id: str) -> CommandOutput:
    match command.command:
        case LoadModelParserModule(path=path_raw):
            return _load_model_parser_module(instance_id, path_raw, aiconfig_instance)
        case ListModels():
            return _run_list_models(instance_id, aiconfig_instance)
        case Create():
            return _run_create(instance_id)
        case Load(path=path_raw):
            return _run_load(instance_id, path_raw, aiconfig_instance)
        case Run():
            return await _run_run(instance_id, aiconfig_instance, command.command)
        case AddPrompt():
            return await _run_add_prompt(instance_id, aiconfig_instance, command.command)
        case UpdatePrompt():
            return await _run_update_prompt(instance_id, aiconfig_instance, command.command)
        case DeletePrompt():
            return await _run_delete_prompt(instance_id, aiconfig_instance, command.command)
        case Save():
            return await _run_save(instance_id, aiconfig_instance, command.command)


def _run_list_models(instance_id: str, aiconfig_instance: AIConfigRuntime | None) -> CommandOutput:
    ids: list[str] = ModelParserRegistry.parser_ids()  # type: ignore
    return CommandOutput(
        instance_id=instance_id,
        message="Listed models",
        is_success=True,
        aiconfig_instance=aiconfig_instance,
        data={"ids": ids},
    )


def _load_model_parser_module(instance_id: str, path_raw: server_utils.UnvalidatedPath, aiconfig_instance: AIConfigRuntime | None) -> CommandOutput:
    load_module_result = server_utils.get_validated_path(path_raw).and_then(server_utils.load_user_parser_module)
    match load_module_result:
        case Ok(_module):
            return CommandOutput(
                instance_id=instance_id,
                message=f"Loaded module {path_raw}, output: {_module}",
                is_success=True,
                aiconfig_instance=None,
            )
        case Err(e):
            return CommandOutput(
                instance_id=instance_id,
                message=f"Failed to load module {path_raw}: {e}",
                is_success=False,
                aiconfig_instance=None,
            )


def _run_create(instance_id: str) -> CommandOutput:
    aiconfig_instance = AIConfigRuntime.create()  # type: ignore
    return CommandOutput(
        instance_id=instance_id,
        message="Created new AIConfig",
        is_success=True,
        aiconfig_instance=aiconfig_instance,
    )


def _run_load(
    instance_id: str,
    path_raw: server_utils.UnvalidatedPath | None,
    aiconfig_instance: AIConfigRuntime | None,
) -> CommandOutput:
    if path_raw is None:
        if aiconfig_instance is None:
            return CommandOutput(
                instance_id=instance_id,
                message="No AIConfig in memory or path provided",
                is_success=False,
                aiconfig_instance=None,
            )
        else:
            return CommandOutput(
                instance_id=instance_id,
                message="AIConfig already loaded. Here it is!",
                is_success=True,
                aiconfig_instance=aiconfig_instance,
            )
    else:
        res_path_val = server_utils.get_validated_path(path_raw)
        res_aiconfig = res_path_val.and_then(server_utils.safe_load_from_disk)
        if aiconfig_instance is None:
            LOGGER.info(f"Loaded AIConfig from {res_path_val}")
            return CommandOutput(
                instance_id=instance_id,
                message=f"Loaded from {res_path_val}",
                is_success=res_aiconfig.is_ok(),
                aiconfig_instance=res_aiconfig.unwrap_or(None),
            )
        else:
            message = f"Loaded AIConfig from {res_path_val}. This may have overwritten in-memory changes."
            LOGGER.warning(message)
            return CommandOutput(
                instance_id=instance_id,
                message=message,
                is_success=res_aiconfig.is_ok(),
                aiconfig_instance=res_aiconfig.unwrap_or(None),
            )


async def _command_to_response_and_new_state(
    command: Result[Command, str], current_connection_state: ConnectionState, instance_id: str
) -> Tuple[str, ConnectionState]:
    current_aiconfig_instance = current_connection_state.aiconfig_instance
    current_aiconfig_path = current_connection_state.aiconfig_path
    match command:
        case Ok(command_ok):
            LOGGER.info(f"{command_ok=}")
            command_output = await _run_command(command_ok, current_aiconfig_instance, instance_id)
            aiconfig_instance_updated = command_output.aiconfig_instance
            response = json.dumps(command_output.to_json())
            aiconfig_path = _command_to_aiconfig_path(command_ok)
            aiconfig_path_updated = aiconfig_path or current_aiconfig_path
            return response, ConnectionState(aiconfig_instance=aiconfig_instance_updated, aiconfig_path=aiconfig_path_updated)
        case Err(e):
            response = json.dumps(
                {
                    #
                    "instance_id": instance_id,
                    "message": f"Failed to parse command: {e}",
                    "is_success": False,
                }
            )
            return response, ConnectionState(aiconfig_instance=current_aiconfig_instance, aiconfig_path=current_aiconfig_path)


def _command_to_aiconfig_path(command: Command) -> server_utils.UnvalidatedPath | None:
    match command.command:
        case Load(path=path_raw):
            return path_raw
        case Save(path=path_raw):
            return path_raw
        case _:
            return None


async def _run_websocket_connection(websocket: WebSocket, edit_config: EditServerConfig | None) -> Result[str, str]:
    instance_id, connection_state = _init_websocket_connection(edit_config)
    LOGGER.info(f"{connection_state.aiconfig_path=}")
    global global_state
    global_state.active_websockets[instance_id] = WebSocketState(websocket=websocket, connection_state=connection_state)

    while True:
        try:
            data = await websocket.receive_text()
            LOGGER.debug(f"DATA:#\n{data}#, type: {type(data)}")
            command = core_utils.safe_model_validate_json(data, Command)
            response, connection_state = await _command_to_response_and_new_state(command, connection_state, instance_id)
            LOGGER.info(f"{connection_state.aiconfig_path=}")
            LOGGER.debug(f"sending {response=}")
            await websocket.send_text(response)
        except WebSocketDisconnect:
            cleanup_res = await _cleanup_websocket_connection(global_state.active_websockets, instance_id)
            LOGGER.info(f"{cleanup_res=}")


def _init_websocket_connection(edit_config: EditServerConfig | None) -> Tuple[str, ConnectionState]:
    instance_id = str(uuid.uuid4())
    LOGGER.info(f"Starting websocket connection. {instance_id=}")

    if edit_config and edit_config.aiconfig_path is not None:
        LOGGER.info("Server started with AIConfig path. Loading. Path: %s. ", edit_config.aiconfig_path)
        connection_state = ConnectionState(aiconfig_instance=None)
        response_load = _run_load(instance_id, server_utils.UnvalidatedPath(edit_config.aiconfig_path), connection_state.aiconfig_instance)
        if response_load.is_success:
            LOGGER.info("Loaded AIConfig from %s", edit_config.aiconfig_path)
        else:
            LOGGER.error("Failed to load AIConfig from %s", edit_config.aiconfig_path)

        connection_state = ConnectionState(
            aiconfig_instance=response_load.aiconfig_instance, aiconfig_path=server_utils.UnvalidatedPath(edit_config.aiconfig_path)
        )
        return instance_id, connection_state
    else:
        LOGGER.info("Server started without AIConfig path. Creating.")
        response_create = _run_create(instance_id)
        if response_create.is_success:
            LOGGER.info("Created AIConfig")
        else:
            LOGGER.error("Failed to create AIConfig")
        connection_state = ConnectionState(aiconfig_instance=response_create.aiconfig_instance, aiconfig_path=None)
        return instance_id, connection_state


async def _cleanup_websocket_connection(active_connections_set: dict[str, WebSocketState], instance_id: str) -> None:
    LOGGER.info(f"Closing websocket connection {instance_id=}")
    web_socket_state = active_connections_set[instance_id]
    # await web_socket_state.websocket.close(code=1001)
    if web_socket_state.connection_state.aiconfig_path is not None:
        LOGGER.info(f"Attempting to save AIConfig to disk")
        save = Save(command_name="save", path=web_socket_state.connection_state.aiconfig_path)
        save_res = await _run_save(instance_id, web_socket_state.connection_state.aiconfig_instance, save)
        if save_res.is_success:
            LOGGER.info(f"Saved AIConfig to {web_socket_state.connection_state.aiconfig_path}")
        else:
            LOGGER.error(f"Failed to save AIConfig to {web_socket_state.connection_state.aiconfig_path}")
    else:
        LOGGER.info(f"No AIConfig path provided, not saving to disk")
    del active_connections_set[instance_id]


@app.websocket("/ws_manage_aiconfig_instance")
async def accept_and_run_websocket(websocket: WebSocket):
    await websocket.accept()
    global editor_config
    websocket_result = await _run_websocket_connection(websocket, editor_config)
    LOGGER.info(f"{websocket_result=}")


def _init_app_state(edit_config: EditServerConfig):
    LOGGER.setLevel(edit_config.log_level)
    LOGGER.info("Edit config: %s", edit_config.model_dump_json())

    res_load_module = (
        server_utils.get_validated_path(edit_config.parsers_module_path)
        #
        .and_then(server_utils.load_user_parser_module)
    )
    match res_load_module:
        case Ok(_module):
            LOGGER.info(f"Loaded module {edit_config.parsers_module_path}, output: {_module}")
        case Err(e):
            LOGGER.warning(f"Failed to load module {edit_config.parsers_module_path}: {e}")

    # Store the edit_config in the global variable so it can be accessed
    # by the websocket connections
    global editor_config
    editor_config = edit_config


def run_backend_server(edit_config: EditServerConfig) -> Result[str, str]:
    global global_state
    global_state.editor_config = edit_config
    log_level_for_uvicorn = edit_config.log_level.lower() if isinstance(edit_config.log_level, str) else edit_config.log_level
    uvicorn.run(
        app,
        host="localhost",
        port=edit_config.server_port,
        log_level=log_level_for_uvicorn,
        # reload=True,
        # 1 year should be long enough, right?
        ws_ping_timeout=365 * 24 * 3600,
        timeout_keep_alive=365 * 24 * 3600,
        ws_max_size=100000000,
        ws_max_queue=100000000,
    )
    return Ok("Done")
