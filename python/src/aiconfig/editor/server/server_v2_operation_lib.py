## SECTION: Imports

from abc import abstractmethod
import os
import sys
import importlib
import importlib.util

from types import ModuleType
from typing import Callable, Generic, Protocol, TypeVar

import aiconfig.editor.server.server_v2_common as server_common
import lastmile_utils.lib.core.api as core_utils
from aiconfig.Config import AIConfigRuntime
from result import Err, Ok, Result

from aiconfig.schema import ExecuteResult

logger = core_utils.get_logger(__name__, log_file_path="editor_server_v2.log")

## SECTION: Types

T_MethodOutput = TypeVar("T_MethodOutput", None, list[ExecuteResult], covariant=True)


class RunMethodFn(Protocol, Generic[server_common.T_Operation, T_MethodOutput]):
    @abstractmethod
    async def __call__(self, aiconfig_instance: AIConfigRuntime, inputs: server_common.T_Operation) -> T_MethodOutput:  # type: ignore[fixme]
        pass


class RunOperationFn(Protocol, Generic[server_common.T_Operation]):
    @abstractmethod
    async def __call__(
        self, aiconfig_instance: AIConfigRuntime, instance_id: str, inputs: server_common.T_Operation
    ) -> server_common.OperationOutput:
        pass


class AIConfigFn(Protocol, Generic[server_common.P, server_common.T_Output]):
    @abstractmethod
    async def __call__(
        self, aiconfig_instance: AIConfigRuntime, *args: server_common.P.args, **kwargs: server_common.P.kwargs
    ) -> server_common.T_Output:
        pass


def aiconfig_result_to_operation_output(
    res_aiconfig: Result[AIConfigRuntime, str], instance_id: str, message_suffix: str = ""
) -> server_common.OperationOutput:
    match res_aiconfig:
        case Ok(aiconfig_instance):
            return server_common.OperationOutput(
                instance_id=instance_id,
                message=message_suffix,
                is_success=True,
                aiconfig_instance=aiconfig_instance,
            )
        case Err(e):
            return server_common.OperationOutput(
                instance_id=instance_id,
                message=f"No AIConfig: {e}" + message_suffix,
                is_success=False,
                aiconfig_instance=None,
            )


def operation_output_to_response(operation_output: server_common.OperationOutput) -> server_common.Response:
    return server_common.Response(
        instance_id=operation_output.instance_id,
        message=operation_output.message,
        is_success=operation_output.is_success,
        aiconfig_instance=operation_output.aiconfig_instance,
        data=operation_output.data,
    )


def operation_to_aiconfig_path(operation: server_common.Operation) -> server_common.UnvalidatedPath | None:
    match operation:
        case server_common.Load(path=path_raw):
            return path_raw
        case server_common.Save(path=path_raw):
            return path_raw
        case _:
            return None


def operation_input_to_output(run_method_fn: RunMethodFn[server_common.T_Operation, T_MethodOutput]) -> RunOperationFn[server_common.T_Operation]:
    """Decorator to make a function:
    (a) robust to exceptions,
    (b) Convert an arbitrary output into a (standard) OperationOutput.

    The input function takes an AIConfigRuntime instance and one of the Operation subtypes
    and returns some value depending on which operation was run.

    The output (decorated) function does essentially the same thing, but with the properties listed above.
    The output function also automatically accepts the instance_id, which maps 1:1 with the aiconfig,
    and bundles it into the operation output.

    See `run_add_prompt() for example`.

    """

    async def _new_fn(aiconfig_instance: AIConfigRuntime, instance_id: str, inputs: server_common.T_Operation) -> server_common.OperationOutput:
        @core_utils.safe_run_fn_async
        async def _wrap_input_fn(aiconfig_instance: AIConfigRuntime, inputs: server_common.T_Operation) -> T_MethodOutput:
            return await run_method_fn(aiconfig_instance, inputs)

        method_output = await _wrap_input_fn(aiconfig_instance, inputs)

        logger.info(f"Ran operation: {inputs}")
        out = server_common.OperationOutput.from_method_output(instance_id, aiconfig_instance, method_output, f"Ran operation: {inputs}")
        logger.info(f"{out.instance_id=}, {out.message=}")
        return out

    return _new_fn


@core_utils.safe_run_fn
def safe_run_create() -> AIConfigRuntime:
    out = AIConfigRuntime.create()  # type: ignore
    return out


@core_utils.safe_run_fn_async
async def safe_save_to_disk(aiconfig_instance: AIConfigRuntime, path: server_common.UnvalidatedPath) -> None:
    return aiconfig_instance.save(path)


@core_utils.safe_run_fn
def safe_load_from_disk(aiconfig_path: server_common.ValidatedPath) -> AIConfigRuntime:
    aiconfig = AIConfigRuntime.load(aiconfig_path)  # type: ignore
    return aiconfig


def _import_module_from_path(path_to_module: str) -> Result[ModuleType, str]:
    logger.debug(f"{path_to_module=}")
    resolved_path = server_common.resolve_path(path_to_module)
    logger.debug(f"{resolved_path=}")
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


@core_utils.safe_run_fn_async
async def _register_user_model_parsers(user_register_fn: Callable[[], None]) -> None:
    out = user_register_fn()
    return out


def _load_register_fn_from_user_module(user_module: ModuleType) -> Result[Callable[[], None], str]:
    if not hasattr(user_module, "register_model_parsers"):
        return Err(f"User module {user_module} does not have a register_model_parsers function.")
    register_fn = getattr(user_module, "register_model_parsers")
    if not callable(register_fn):
        return Err(f"User module {user_module} does not have a register_model_parsers function")
    else:
        return Ok(register_fn)


async def load_user_parser_module(path_to_module: str) -> Result[None, str]:
    logger.info(f"Importing parsers module from {path_to_module}")
    res_user_module = _import_module_from_path(path_to_module)
    register_result = await (
        res_user_module.and_then(_load_register_fn_from_user_module)
        #
        .and_then_async(_register_user_model_parsers)
    )
    return register_result
