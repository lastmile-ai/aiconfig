## SECTION: Imports

import asyncio
import dataclasses
import json
import threading

from queue import Empty, Queue
import time
from typing import Any, cast

import aiconfig.editor.server.server_v2_common as server_common
import aiconfig.editor.server.server_v2_operation_lib as operation_lib
import lastmile_utils.lib.core.api as core_utils
from aiconfig.Config import AIConfigRuntime
from aiconfig.model_parser import InferenceOptions
from aiconfig.registry import ModelParserRegistry
from fastapi import WebSocket
from result import Err, Ok, Result

from aiconfig.schema import ExecuteResult, Prompt

logger = core_utils.get_logger(__name__, log_file_path="editor_server_v2.log")


## SECTION: AIConfig operation run functions (following operations sent over websocket)


async def run_operation(
    operation: server_common.Operation, aiconfig_instance: AIConfigRuntime, instance_id: str, websocket: WebSocket
) -> server_common.OperationOutput:
    match operation:
        case server_common.GetInstanceStatus():
            return await run_get_instance_status(instance_id)
        case server_common.ListModels():
            return await run_list_models(instance_id)
        case server_common.LoadModelParserModule(path=path_raw):
            return await run_load_model_parser_module(instance_id, path_raw)
        case server_common.Create():
            return await run_create(instance_id)
        case server_common.Load(path=path_raw):
            return await run_load(aiconfig_instance, instance_id, path_raw)
        case server_common.Run():
            return await run_run(aiconfig_instance, instance_id, operation, websocket)
        case server_common.AddPrompt():
            return await run_add_prompt(aiconfig_instance, instance_id, operation)
        case server_common.UpdatePrompt():
            return await run_update_prompt(aiconfig_instance, instance_id, operation)
        case server_common.DeletePrompt():
            return await run_delete_prompt(aiconfig_instance, instance_id, operation)
        case server_common.Save():
            return await run_save(aiconfig_instance, instance_id, operation)
        case server_common.UpdateModel():
            return await run_update_model(aiconfig_instance, instance_id, operation)
        case server_common.SetParameter():
            return await run_set_parameter(aiconfig_instance, instance_id, operation)
        case server_common.SetParameters():
            return await run_set_parameters(aiconfig_instance, instance_id, operation)
        case server_common.DeleteParameter():
            return await run_delete_parameter(aiconfig_instance, instance_id, operation)
        case server_common.SetName():
            return await run_set_name(aiconfig_instance, instance_id, operation)
        case server_common.SetDescription():
            return await run_set_description(aiconfig_instance, instance_id, operation)
        case server_common.MockRun():
            return run_mock_run(aiconfig_instance, instance_id, operation)


async def run_get_instance_status(instance_id: str) -> server_common.OperationOutput:
    return server_common.OperationOutput(
        instance_id=instance_id,
        message="See `data` field for instance status",
        is_success=True,
        aiconfig_instance=None,
        data={"status": "OK"},
    )


async def run_list_models(
    instance_id: str,
) -> server_common.OperationOutput:
    ids: list[str] = ModelParserRegistry.parser_ids()  # type: ignore
    return server_common.OperationOutput(
        instance_id=instance_id,
        message="Listed models",
        is_success=True,
        aiconfig_instance=None,
        data={"ids": ids},
    )


async def run_load_model_parser_module(instance_id: str, path_raw: server_common.UnvalidatedPath) -> server_common.OperationOutput:
    load_module_result = await server_common.get_validated_path(path_raw).and_then_async(operation_lib.load_user_parser_module)
    match load_module_result:
        case Ok(_module):
            return server_common.OperationOutput(
                instance_id=instance_id,
                message=f"Loaded module {path_raw}, output: {_module}",
                is_success=True,
                aiconfig_instance=None,
            )
        case Err(e):
            return server_common.OperationOutput(
                instance_id=instance_id,
                message=f"Failed to load module {path_raw}: {e}",
                is_success=False,
                aiconfig_instance=None,
            )


async def run_create(instance_id: str) -> server_common.OperationOutput:
    aiconfig_instance = operation_lib.safe_run_create()
    return operation_lib.aiconfig_result_to_operation_output(aiconfig_instance, instance_id)


async def run_load(
    aiconfig_instance: AIConfigRuntime,
    instance_id: str,
    path_raw: server_common.UnvalidatedPath | None,
) -> server_common.OperationOutput:
    if path_raw is None:
        return server_common.OperationOutput(
            instance_id=instance_id,
            message="No path given, but AIConfig is loaded into memory. Here it is!",
            is_success=True,
            aiconfig_instance=aiconfig_instance,
        )
    else:
        res_path_val = server_common.get_validated_path(path_raw)
        res_aiconfig = res_path_val.and_then(operation_lib.safe_load_from_disk)
        message = f"Loaded AIConfig from {res_path_val}. This may have overwritten in-memory changes."
        logger.warning(message)
        return server_common.OperationOutput(
            instance_id=instance_id,
            message=message,
            is_success=res_aiconfig.is_ok(),
            aiconfig_instance=res_aiconfig.unwrap_or(None),
        )


async def run_run(
    aiconfig_instance: AIConfigRuntime, instance_id: str, inputs: server_common.Run, websocket: WebSocket
) -> server_common.OperationOutput:
    if inputs.stream:
        logger.info(f"Running streaming operation: {inputs}")

        out_queue: Queue[core_utils.JSONObject | None] = Queue()

        def _stream_callback_queue_put(data: core_utils.JSONObject, accumulated_data: Any, index: int) -> None:
            logger.debug(f"[stream callback]put {data=}")
            # time.sleep(0.1)
            out_queue.put(data)

        inference_options = InferenceOptions(stream=True, stream_callback=_stream_callback_queue_put)

        @core_utils.safe_run_fn_async
        async def _run_streaming_inner(aiconfig_instance: AIConfigRuntime, inputs: server_common.Run) -> list[ExecuteResult]:
            return await aiconfig_instance.run(inputs.prompt_name, inputs.params, inference_options)  #  type: ignore

        # This function gets asyncio.run() to type check
        async def _run_inner_wrap():
            return await _run_streaming_inner(aiconfig_instance, inputs)

        @dataclasses.dataclass
        class ThreadOutput:
            value: Result[list[ExecuteResult], str] = Err("Not set")

        def _run_thread_main(out_queue: Queue[dict[str, str] | None], output: ThreadOutput) -> Result[list[ExecuteResult], str]:
            method_output = asyncio.run(_run_inner_wrap())
            logger.info(f"Ran operation: {inputs}")
            output.value = method_output
            out_queue.put(None)
            return method_output

        async def _send(data: core_utils.JSONObject) -> None:
            logger.debug(f"[send]{data=}")
            response = json.dumps(data)
            send_res = await websocket.send_text(response)
            logger.debug(f"sent {response=}, {send_res=}")

        thread_output = ThreadOutput()
        thread = threading.Thread(target=_run_thread_main, args=(out_queue, thread_output))
        thread.start()

        async def _read_queue_and_send_until_empty() -> None:
            while True:
                try:
                    data = out_queue.get(block=True, timeout=10)
                    logger.debug(f"[get]{data=}")
                    if data is None:
                        return
                    await _send(data)
                except Empty as e:
                    raise ValueError(f"Timeout waiting for output from operation") from e

        await _read_queue_and_send_until_empty()
        thread.join()
        return server_common.OperationOutput.from_method_output(instance_id, aiconfig_instance, thread_output.value, "Method: run with streaming")
    else:

        @core_utils.safe_run_fn_async
        async def _run_not_stream(aiconfig_instance: AIConfigRuntime, inputs: server_common.Run) -> list[ExecuteResult]:
            out: list[ExecuteResult] = cast(
                list[ExecuteResult], await aiconfig_instance.run(inputs.prompt_name, inputs.params, InferenceOptions(stream=False))  # type: ignore
            )
            return out

        result_run = await _run_not_stream(aiconfig_instance, inputs)
        return server_common.OperationOutput.from_method_output(instance_id, aiconfig_instance, result_run, "Method: run w/o streaming")


@operation_lib.operation_input_to_output
async def run_add_prompt(aiconfig_instance: AIConfigRuntime, inputs: server_common.AddPrompt) -> None:
    return aiconfig_instance.add_prompt(inputs.prompt_name, inputs.prompt_data, inputs.index)


@operation_lib.operation_input_to_output
async def run_update_prompt(aiconfig_instance: AIConfigRuntime, inputs: server_common.UpdatePrompt) -> None:
    return aiconfig_instance.update_prompt(inputs.prompt_name, inputs.prompt_data)


@operation_lib.operation_input_to_output
async def run_delete_prompt(aiconfig_instance: AIConfigRuntime, inputs: server_common.DeletePrompt) -> None:
    return aiconfig_instance.delete_prompt(inputs.prompt_name)


@operation_lib.operation_input_to_output
async def run_save(aiconfig_instance: AIConfigRuntime, inputs: server_common.Save) -> None:
    return aiconfig_instance.save(inputs.path)


@operation_lib.operation_input_to_output
async def run_update_model(aiconfig_instance: AIConfigRuntime, inputs: server_common.UpdateModel) -> None:
    return aiconfig_instance.update_model(inputs.model_name, inputs.settings, inputs.prompt_name)


@operation_lib.operation_input_to_output
async def run_set_parameter(aiconfig_instance: AIConfigRuntime, inputs: server_common.SetParameter) -> None:
    return aiconfig_instance.set_parameter(inputs.parameter_name, inputs.parameter_value, inputs.prompt_name)


@operation_lib.operation_input_to_output
async def run_set_parameters(aiconfig_instance: AIConfigRuntime, inputs: server_common.SetParameters) -> None:
    return aiconfig_instance.set_parameters(inputs.parameters, inputs.prompt_name)


@operation_lib.operation_input_to_output
async def run_delete_parameter(aiconfig_instance: AIConfigRuntime, inputs: server_common.DeleteParameter) -> None:
    return aiconfig_instance.delete_parameter(inputs.parameter_name, inputs.prompt_name)  # type: ignore


@operation_lib.operation_input_to_output
async def run_set_name(aiconfig_instance: AIConfigRuntime, inputs: server_common.SetName) -> None:
    return aiconfig_instance.set_name(inputs.name)


@operation_lib.operation_input_to_output
async def run_set_description(aiconfig_instance: AIConfigRuntime, inputs: server_common.SetDescription) -> None:
    return aiconfig_instance.set_description(inputs.description)


def run_mock_run(aiconfig_instance: AIConfigRuntime, instance_id: str, inputs: server_common.MockRun) -> server_common.OperationOutput:
    """Sleep for `seconds` and add two test prompts to the aiconfig."""
    logger.info(f"Running operation: {inputs}")
    s = inputs.seconds
    if s < 0.2:
        return server_common.OperationOutput(
            instance_id=instance_id,
            message=f"Sleep time must be at least 0.2 second, got {s}",
            is_success=False,
            aiconfig_instance=None,
        )

    SLEEP_PART_1 = 0.1
    SLEEP_PART_2 = s - SLEEP_PART_1
    time.sleep(SLEEP_PART_1)
    try:
        last = 0
        if len(aiconfig_instance.prompt_index) > 0:
            last = max(int(k) for k in aiconfig_instance.prompt_index.keys())
        next_ = last + 1
        aiconfig_instance.add_prompt(str(next_), Prompt(name=str(next_), input=f"mock_prompt_{next_}"))
        time.sleep(SLEEP_PART_2)
        aiconfig_instance.add_prompt(str(next_ + 1), Prompt(name=str(next_ + 1), input=f"mock_prompt_{next_+1}"))
        if inputs.do_raise:

            class MockAIConfigException(Exception):
                pass

            try:
                raise MockAIConfigException("Mock AIConfig exception")
            except MockAIConfigException as e:
                return server_common.OperationOutput(
                    instance_id=instance_id,
                    message=f"Raised an exception as requested",
                    is_success=False,
                    aiconfig_instance=None,
                )
        else:
            return server_common.OperationOutput(
                instance_id=instance_id,
                message=f"Blocked for {s} seconds and added prompts {next_}, {next_+1}",
                is_success=True,
                aiconfig_instance=aiconfig_instance,
            )
    except ValueError as e:
        err = core_utils.ErrWithTraceback(e)
        return server_common.OperationOutput(
            instance_id=instance_id,
            message=f"Test aiconfig is invalid. All prompt names must be ints. Got {err}, {aiconfig_instance.prompt_index.keys()}",
            is_success=False,
            aiconfig_instance=None,
        )
