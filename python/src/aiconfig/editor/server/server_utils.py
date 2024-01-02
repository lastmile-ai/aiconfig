import importlib
import importlib.util
import logging
import os
import sys
import typing
from dataclasses import dataclass
from enum import Enum
from types import ModuleType
from typing import Any, Callable, NewType, Type, TypeVar, cast

import lastmile_utils.lib.core.api as core_utils
import result
from aiconfig.Config import AIConfigRuntime
from aiconfig.registry import ModelParserRegistry
from flask import Flask
from pydantic import field_validator
from result import Err, Ok, Result

from aiconfig.schema import Prompt, PromptMetadata

MethodName = NewType("MethodName", str)

logging.getLogger("werkzeug").disabled = True

logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)

log_handler = logging.FileHandler("editor_flask_server.log", mode="a")
formatter = logging.Formatter(core_utils.LOGGER_FMT)
log_handler.setFormatter(formatter)

LOGGER.addHandler(log_handler)

# TODO unhardcode
LOGGER.setLevel(logging.INFO)


UnvalidatedPath = NewType("UnvalidatedPath", str)
ValidatedPath = NewType("ValidatedPath", str)

OpArgs = NewType("OpArgs", dict[str, Any])


T = TypeVar("T")

# TODO: protocol
Operation = Callable[[AIConfigRuntime, OpArgs], Result[T, str]]


class ServerMode(Enum):
    # debug = "DEBUG"
    DEBUG_SERVERS = "DEBUG_SERVERS"
    DEBUG_BACKEND = "DEBUG_BACKEND"
    PROD = "PROD"


class EditServerConfig(core_utils.Record):
    server_port: int = 8080
    aiconfig_path: str = "my_aiconfig.aiconfig.json"
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


FlaskResponse = NewType("FlaskResponse", tuple[core_utils.JSONObject, int])


@dataclass(frozen=True)
class HttpResponseWithAIConfig:
    message: str
    aiconfig: AIConfigRuntime | None
    code: int = 200

    EXCLUDE_OPTIONS = {
        "prompt_index": True,
        "file_path": True,
        "callback_manager": True,
    }

    def to_flask_format(self) -> FlaskResponse:
        out: core_utils.JSONObject = {
            "message": self.message,
        }
        if self.aiconfig is not None:
            out["aiconfig"] = self.aiconfig.model_dump(exclude=HttpResponseWithAIConfig.EXCLUDE_OPTIONS)

        return FlaskResponse((out, self.code))


def get_server_state(app: Flask) -> ServerState:
    return app.server_state  # type: ignore


def resolve_path(path: str) -> str:
    return os.path.abspath(os.path.expanduser(path))


def get_validated_path(raw_path: str | None, allow_create: bool = False) -> Result[ValidatedPath, str]:
    LOGGER.debug(f"{allow_create=}")
    if not raw_path:
        return Err("No path provided")
    resolved = resolve_path(raw_path)
    if not allow_create and not os.path.isfile(resolved):
        return Err(f"File does not exist: {resolved}")
    return Ok(ValidatedPath(resolved))


def _import_module_from_path(path_to_module: str) -> Result[ModuleType, str]:
    LOGGER.debug(f"{path_to_module=}")
    resolved_path = resolve_path(path_to_module)
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


def load_user_parser_module(path_to_module: str) -> Result[None, str]:
    LOGGER.info(f"Importing parsers module from {path_to_module}")
    res_user_module = _import_module_from_path(path_to_module)
    register_result = (
        res_user_module.and_then(_load_register_fn_from_user_module)  #
        #
        .and_then(_register_user_model_parsers)
    )
    return register_result


def get_http_response_load_user_parser_module(path_to_module: str) -> HttpResponseWithAIConfig:
    register_result = load_user_parser_module(path_to_module)
    match register_result:
        case Ok(_):
            msg = f"Successfully registered model parsers from {path_to_module}"
            LOGGER.info(msg)
            return HttpResponseWithAIConfig(message=msg, aiconfig=None)
        case Err(e):
            msg = f"Failed to register model parsers from {path_to_module}: {e}"
            LOGGER.error(msg)
            return HttpResponseWithAIConfig(message=msg, code=400, aiconfig=None)


def _load_user_parser_module_if_exists(parsers_module_path: str) -> None:
    res = get_validated_path(parsers_module_path).and_then(load_user_parser_module)
    match res:
        case Ok(_):
            LOGGER.info(f"Loaded parsers module from {parsers_module_path}")
        case Err(e):
            LOGGER.warning(f"Failed to load parsers module: {e}")


def safe_load_from_disk(aiconfig_path: ValidatedPath) -> Result[AIConfigRuntime, str]:
    try:
        aiconfig = AIConfigRuntime.load(aiconfig_path)  # type: ignore
        return Ok(aiconfig)
    except Exception as e:
        return core_utils.ErrWithTraceback(e)


def init_server_state(app: Flask, edit_config: EditServerConfig) -> Result[None, str]:
    LOGGER.info("Initializing server state")
    _load_user_parser_module_if_exists(edit_config.parsers_module_path)
    state = get_server_state(app)

    assert state.aiconfig is None
    if os.path.exists(edit_config.aiconfig_path):
        LOGGER.info(f"Loading AIConfig from {edit_config.aiconfig_path}")
        val_path = get_validated_path(edit_config.aiconfig_path)
        aiconfig_runtime = val_path.and_then(safe_load_from_disk)
        match aiconfig_runtime:
            case Ok(aiconfig_runtime_):
                state.aiconfig = aiconfig_runtime_
                LOGGER.info(f"Loaded AIConfig from {edit_config.aiconfig_path}")
                return Ok(None)
            case Err(e):
                LOGGER.error(f"Failed to load AIConfig from {edit_config.aiconfig_path}: {e}")
                return Err(f"Failed to load AIConfig from {edit_config.aiconfig_path}: {e}")
    else:
        LOGGER.info(f"Creating new AIConfig at {edit_config.aiconfig_path}")
        aiconfig_runtime = AIConfigRuntime.create()  # type: ignore
        model_ids = ModelParserRegistry.parser_ids()
        if len(model_ids) > 0:
            aiconfig_runtime.add_prompt("prompt_1", Prompt(name="prompt_1", input="", metadata=PromptMetadata(model=model_ids[0])))

        state.aiconfig = aiconfig_runtime
        LOGGER.info("Created new AIConfig")
        try:
            aiconfig_runtime.save(edit_config.aiconfig_path)
            LOGGER.info(f"Saved new AIConfig to {edit_config.aiconfig_path}")
            state.aiconfig = aiconfig_runtime
            return Ok(None)
        except Exception as e:
            LOGGER.error(f"Failed to create new AIConfig at {edit_config.aiconfig_path}: {e}")
            return core_utils.ErrWithTraceback(e)


def _safe_run_aiconfig_method(aiconfig: AIConfigRuntime, method_name: MethodName, method_args: OpArgs) -> Result[None, str]:
    # TODO: use `out`
    try:
        method = getattr(aiconfig, method_name)
        out = method(**method_args)
        LOGGER.info(f"Method result ({method_name}): {out}")
        return Ok(None)
    except Exception as e:
        LOGGER.info(f"Failed to run method ({method_name}): {e}")
        return core_utils.ErrWithTraceback(e)


def safe_run_aiconfig_static_method(method_name: MethodName, method_args: OpArgs, output_typ: Type[T]) -> Result[T, str]:
    try:
        method = getattr(AIConfigRuntime, method_name)
        out = method(**method_args)
        LOGGER.info(f"Method result: {out}")
        return Ok(out)
    except Exception as e:
        LOGGER.info(f"Failed to run method: {e}")
        return core_utils.ErrWithTraceback(e)


def make_op_run_method(method_name: MethodName) -> Operation[None]:
    def _op(aiconfig: AIConfigRuntime, operation_args: OpArgs) -> Result[None, str]:
        LOGGER.info(f"Running method: {method_name}, {operation_args=}")
        return _safe_run_aiconfig_method(aiconfig, method_name, operation_args)

    return _op


def run_aiconfig_operation_with_op_args(
    aiconfig: AIConfigRuntime | None,
    operation_name: str,
    operation: Operation[None],
    res_op_args: Result[OpArgs, str],
) -> FlaskResponse:
    """
    Use this when you have to do specific logic to map
    the request JSON to the OpArgs. See "/api/run" for example.
    Otherwise, use `run_aiconfig_operation_with_request_json`.
    """
    if aiconfig is None:
        LOGGER.info(f"No AIConfig in memory, can't run {operation_name}.")
        return HttpResponseWithAIConfig(
            message=f"No AIConfig in memory, can't run {operation_name}.",
            code=400,
            aiconfig=None,
        ).to_flask_format()

    LOGGER.info(f"About to run operation: {operation_name}, {res_op_args=}")
    res_run = result.do(
        operation(aiconfig, OpArgs(op_args_ok))
        #
        for op_args_ok in res_op_args
    )

    LOGGER.info(f"{res_run=}")

    match res_run:
        case Ok(_):
            return HttpResponseWithAIConfig(
                message="Done",
                aiconfig=aiconfig,
            ).to_flask_format()
        case Err(e):
            return HttpResponseWithAIConfig(
                message=f"Failed run {operation_name}: {e}",
                code=400,
                aiconfig=None,
            ).to_flask_format()


def _validated_op_args_from_request_json(
    request_json: core_utils.JSONObject,
    signature: dict[str, Type[Any]],
) -> Result[OpArgs, str]:
    if signature.keys() != request_json.keys():
        LOGGER.info(f"Expected keys: {signature.keys()}, got: {request_json.keys()}")
        return Err(f"Expected keys: {signature.keys()}, got: {request_json.keys()}")

    def _resolve(key: str, value: core_utils.JSONValue, signature: dict[str, Type[Any]]) -> Result[Any, str]:
        LOGGER.info(f"Resolving: {key}, {value}, {signature[key]}")
        _type = signature[key]
        if isinstance(value, typing.Dict):
            return core_utils.safe_model_validate_json_object(_type, value)
        else:
            return Ok(value)

    operation_args_results = {key: _resolve(key, value, signature) for key, value in request_json.items()}
    LOGGER.info(f"{operation_args_results=}")
    res_op_args: Result[OpArgs, str] = cast(Result[OpArgs, str], core_utils.result_reduce_dict_all_ok(operation_args_results))

    return res_op_args


def run_aiconfig_operation_with_request_json(
    aiconfig: AIConfigRuntime | None,
    request_json: core_utils.JSONObject,
    operation_name: str,
    operation: Operation[None],
    signature: dict[str, Type[Any]],
) -> FlaskResponse:
    """
    Use this when there is no specific logic needed to extract the OpArgs from the request JSON.
    This is true in cases where the signature is enough to do that automatically
    (inside this function).
    Otherwise (when you do need specific logic like extra validation) use
    `run_aiconfig_operation_with_op_args`.
    """
    LOGGER.info(f"{operation_name=}, {signature=}, {request_json=}")

    op_args = _validated_op_args_from_request_json(request_json, signature)
    match op_args:
        case Ok(op_args_ok):
            return run_aiconfig_operation_with_op_args(aiconfig, operation_name, operation, Ok(op_args_ok))
        case Err(e):
            return HttpResponseWithAIConfig(
                message=f"Failed to run {operation_name}: {e}",
                code=400,
                aiconfig=None,
            ).to_flask_format()
