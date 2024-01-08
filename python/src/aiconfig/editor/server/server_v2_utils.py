## SECTION: Imports and Constants

import asyncio
from dataclasses import dataclass
import logging
import os
import uuid

import lastmile_utils.lib.core.api as core_utils
from fastapi import WebSocket
from result import Err, Ok, Result
import result

import aiconfig.editor.server.server_v2_operation_lib as operation_lib
import aiconfig.editor.server.server_v2_run_operation as operations
import aiconfig.editor.server.server_v2_common as server_common

logger: logging.Logger = core_utils.get_logger(__name__, log_file_path="editor_server_v2.log")


@dataclass
class LoopState:
    instance_state: server_common.InstanceState
    operation_task: asyncio.Task[server_common.OperationOutcome] | None
    recv_task: asyncio.Task[Result[server_common.Command, str]]

    @staticmethod
    async def new(websocket: WebSocket, edit_config: server_common.EditServerConfig) -> Result["LoopState", str]:
        instance_state = await _init_websocket_instance(edit_config)
        return result.do(
            Ok(
                LoopState(
                    #
                    instance_state=instance_state_ok,
                    operation_task=None,
                    recv_task=schedule_receive_task(websocket),
                )
            )
            for instance_state_ok in instance_state
        )


async def _init_websocket_instance(edit_config: server_common.EditServerConfig) -> Result[server_common.InstanceState, str]:
    instance_id = str(uuid.uuid4())
    logger.info(f"Starting websocket connection. {instance_id=}")
    aiconfig_path = server_common.UnvalidatedPath(edit_config.aiconfig_path)
    if os.path.exists(aiconfig_path):
        return result.do(
            Ok(server_common.InstanceState(instance_id=instance_id, aiconfig_instance=aiconfig_instance_ok, aiconfig_path=aiconfig_path))
            for val_path in server_common.get_validated_path(aiconfig_path)
            for aiconfig_instance_ok in operation_lib.safe_load_from_disk(val_path)
        )
    else:
        return await result.do_async(
            #
            Ok(server_common.InstanceState(instance_id=instance_id, aiconfig_instance=aiconfig_instance_ok, aiconfig_path=aiconfig_path))
            for aiconfig_instance_ok in operation_lib.safe_run_create()
            for _ in await operation_lib.safe_save_to_disk(aiconfig_instance_ok, aiconfig_path)
        )


## SECTION: Websocket control and AIConfig instance state management


async def _receive_command(websocket: WebSocket) -> Result[server_common.Command, str]:
    data = await websocket.receive_text()
    logger.debug(f"DATA:#\n{data}#, type: {type(data)}")
    return result.do(Ok(res_cmd.command) for res_cmd in core_utils.safe_model_validate_json(data, server_common.SerializableCommand))


def schedule_operation_task(
    operation: server_common.Operation, instance_state: server_common.InstanceState, websocket: WebSocket
) -> asyncio.Task[server_common.OperationOutcome]:
    logger.info("Running create task")

    async def _operation_task() -> server_common.OperationOutcome:
        return await _get_operation_outcome(operation, instance_state, websocket)

    # Enter run mode
    operation_task = asyncio.create_task(_operation_task())
    logger.info("Created task")
    return operation_task


def schedule_receive_task(websocket: WebSocket) -> asyncio.Task[Result[server_common.Command, str]]:
    async def _task() -> Result[server_common.Command, str]:
        return await _receive_command(websocket)

    return asyncio.create_task(_task())


async def handle_websocket_loop_iteration(
    loop_state: LoopState, websocket: WebSocket
) -> Result[tuple[server_common.Response | None, LoopState], str]:
    if loop_state.operation_task is None:
        return await _handle_new_operation_case(loop_state, websocket)
    else:
        return await _handle_existing_operation_case(loop_state, loop_state.operation_task, websocket)


async def _handle_new_operation_case(
    current_loop_state: LoopState,
    websocket: WebSocket,
) -> Result[tuple[server_common.Response | None, LoopState], str]:
    instance_state = current_loop_state.instance_state
    instance_id = instance_state.instance_id
    res_command = await current_loop_state.recv_task
    new_recv_task = schedule_receive_task(websocket)
    logger.info(f"{res_command=}")
    match res_command:
        case Ok(command):
            match command:
                case server_common.Cancel():
                    logger.info("Received cancel command but no operation is running")
                    response = server_common.Response.from_error_message(instance_id, "Received cancel command but no operation is running")
                    new_loop_state = LoopState(instance_state=instance_state, operation_task=None, recv_task=new_recv_task)
                    return Ok((response, new_loop_state))
                case _:
                    loop_state = LoopState(
                        instance_state=instance_state,
                        operation_task=schedule_operation_task(command, instance_state, websocket),
                        recv_task=new_recv_task,
                    )
                    return Ok((None, loop_state))
        case Err(e):
            logger.error(f"Failed to parse command: {e}")
            response = server_common.Response.from_error_message(instance_id, f"Failed to parse command: {e}")
            loop_state = LoopState(instance_state=instance_state, operation_task=None, recv_task=new_recv_task)
            return Ok((response, loop_state))


async def _handle_existing_operation_case(
    current_loop_state: LoopState, current_operation_task: asyncio.Task[server_common.OperationOutcome], websocket: WebSocket
) -> Result[tuple[server_common.Response | None, LoopState], str]:
    # both recv task and operation task are running
    # Wait for one to finish
    logger.info("Both recv task and operation task running. Waiting for one to finish.")
    instance_state = current_loop_state.instance_state

    done, pending = await asyncio.wait([current_operation_task, current_loop_state.recv_task], return_when=asyncio.FIRST_COMPLETED)
    # At least one is now done
    if not any(t.done() for t in [current_loop_state.recv_task, current_operation_task]):
        return Err(f"Got done and pending sets, but tasks are still running. This should not happen. {done=}, {pending=}")
    else:
        if current_operation_task.done():
            done_task = server_common.DoneTask(current_operation_task)
            return Ok(_handle_operation_task_done(current_loop_state, done_task, instance_state))
        else:
            done_task = server_common.DoneTask(current_loop_state.recv_task)
            return Ok(_handle_recv_task_done(current_operation_task, done_task, instance_state, websocket))


def _handle_operation_task_done(
    current_loop_state: LoopState,
    current_operation_done_task: server_common.DoneTask[server_common.OperationOutcome],
    instance_state: server_common.InstanceState,
) -> tuple[server_common.Response | None, LoopState]:
    current_operation_task = current_operation_done_task.task
    if current_operation_task.cancelled():
        logger.info("Operation task cancelled")
        loop_state = LoopState(instance_state=instance_state, operation_task=None, recv_task=current_loop_state.recv_task)
        return (None, loop_state)
    else:
        logger.info("Operation task done")
        task_result = current_operation_task.result()
        loop_state = LoopState(instance_state=task_result.instance_state, operation_task=None, recv_task=current_loop_state.recv_task)
        response = operation_lib.operation_output_to_response(task_result.operation_output)
        return (response, loop_state)


def _handle_recv_task_done(
    current_operation_task: asyncio.Task[server_common.OperationOutcome],
    current_recv_done_task: server_common.DoneTask[Result[server_common.Command, str]],
    instance_state: server_common.InstanceState,
    websocket: WebSocket,
) -> tuple[server_common.Response | None, LoopState]:
    current_recv_task = current_recv_done_task.task
    instance_id = instance_state.instance_id
    if current_recv_task.cancelled():
        logger.info("Recv task cancelled")
        loop_state = LoopState(instance_state=instance_state, operation_task=current_operation_task, recv_task=schedule_receive_task(websocket))
        return (None, loop_state)
    else:
        logger.info("Recv task done")
        res_command = current_recv_task.result()
        match res_command:
            case Ok(command):
                return _handle_new_command_while_operation_task_running(command, current_operation_task, instance_state, websocket)
            case Err(e):
                logger.error(f"Failed to parse command: {e}")
                response = server_common.Response.from_error_message(instance_id, f"Failed to parse command: {e}")
                loop_state = LoopState(instance_state=instance_state, operation_task=None, recv_task=schedule_receive_task(websocket))
                return (response, loop_state)


def _handle_new_command_while_operation_task_running(
    command: server_common.Command,
    current_operation_task: asyncio.Task[server_common.OperationOutcome],
    instance_state: server_common.InstanceState,
    websocket: WebSocket,
) -> tuple[server_common.Response | None, LoopState]:
    instance_id = instance_state.instance_id
    match command:
        case server_common.Cancel():
            logger.info("Received cancel command while operation task is running. Cancelling operation.")
            current_operation_task.cancel()
            loop_state = LoopState(instance_state=instance_state, operation_task=None, recv_task=schedule_receive_task(websocket))
            response = server_common.Response(
                instance_id=instance_id,
                message="Cancelling command",
                is_success=True,
                aiconfig_instance=None,
            )
            return (response, loop_state)
        case _:
            # TODO: something other than _
            logger.info("Received operation while operation task is running. Ignoring request.")
            loop_state = LoopState(
                instance_state=instance_state,
                operation_task=current_operation_task,
                recv_task=schedule_receive_task(websocket),
            )
            response = server_common.Response.from_error_message(
                #
                instance_id,
                "Received operation while operation task is running. Ignoring request.",
            )
            return (response, loop_state)


async def _get_operation_outcome(
    operation: server_common.Operation,
    instance_state: server_common.InstanceState,
    websocket: WebSocket,
) -> server_common.OperationOutcome:
    current_aiconfig_instance = instance_state.aiconfig_instance
    current_aiconfig_path = instance_state.aiconfig_path
    instance_id = instance_state.instance_id
    operation_output = await operations.run_operation(operation, current_aiconfig_instance, instance_id, websocket)

    aiconfig_instance_updated = operation_output.aiconfig_instance if operation_output.aiconfig_instance is not None else current_aiconfig_instance
    aiconfig_path = operation_lib.operation_to_aiconfig_path(operation)
    aiconfig_path_updated = aiconfig_path or current_aiconfig_path
    logger.debug("Updated instance: %s", aiconfig_instance_updated)
    return server_common.OperationOutcome(
        operation_output=operation_output,
        instance_state=server_common.InstanceState(
            instance_id=instance_id, aiconfig_instance=aiconfig_instance_updated, aiconfig_path=aiconfig_path_updated
        ),
    )
