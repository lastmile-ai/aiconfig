## SECTION: Imports

from dataclasses import dataclass
from enum import Enum
import json
import os
from typing import Any, NewType, Optional, ParamSpec, TypeVar

import lastmile_utils.lib.core.api as core_utils
from fastapi import WebSocket
from result import Err, Ok, Result

import asyncio
from dataclasses import dataclass
from typing import Generic, TypeVar

from result import Result
from typing import Any, Literal, TypeVar

import lastmile_utils.lib.core.api as core_utils
from pydantic import Field

from aiconfig.schema import Prompt

import aiconfig.editor.server.server_v2_common as server_common


from aiconfig.Config import AIConfigRuntime

logger = core_utils.get_logger(__name__, log_file_path="editor_server_v2.log")

## SECTION: Common types

P = ParamSpec("P")
T_Output = TypeVar("T_Output", covariant=True)

UnvalidatedPath = NewType("UnvalidatedPath", str)
ValidatedPath = NewType("ValidatedPath", str)


class GetInstanceStatus(core_utils.Record):
    # This is one of the equivalents of the old /api/server_status endpoint
    command_name: Literal["get_instance_status"]
    instance_id: str
    status: str


class ListModels(core_utils.Record):
    command_name: Literal["list_models"]


class LoadModelParserModule(core_utils.Record):
    command_name: Literal["load_model_parser_module"]
    path: server_common.UnvalidatedPath


class Load(core_utils.Record):
    command_name: Literal["load"]
    path: server_common.UnvalidatedPath | None = None


class Save(core_utils.Record):
    command_name: Literal["save"]
    path: server_common.UnvalidatedPath


class Create(core_utils.Record):
    command_name: Literal["create"]


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


class UpdateModel(core_utils.Record):
    command_name: Literal["update_model"]
    model_name: str | None
    settings: dict[str, Any]
    prompt_name: str | None


class SetParameter(core_utils.Record):
    command_name: Literal["set_parameter"]
    parameter_name: str
    parameter_value: str | dict[str, Any]
    prompt_name: str | None


class SetParameters(core_utils.Record):
    command_name: Literal["set_parameters"]
    parameters: dict[str, Any]
    prompt_name: str | None


class DeleteParameter(core_utils.Record):
    command_name: Literal["delete_parameter"]
    parameter_name: str
    prompt_name: str


class SetName(core_utils.Record):
    command_name: Literal["set_name"]
    name: str


class SetDescription(core_utils.Record):
    command_name: Literal["set_description"]
    description: str


class MockRun(core_utils.Record):
    """For testing only"""

    command_name: Literal["mock_run"]
    seconds: float


# THIS MUST BE KEPT IN SYNC WITH T_OPERATION BELOW
Operation = (
    GetInstanceStatus
    | ListModels
    | LoadModelParserModule
    | Create
    | Load
    | Run
    | AddPrompt
    | UpdatePrompt
    | DeletePrompt
    | Save
    | UpdateModel
    | SetParameter
    | SetParameters
    | DeleteParameter
    | SetName
    | SetDescription
    | MockRun
)

# THIS MUST BE KEPT IN SYNC WITH OPERATION ABOVE
T_Operation = TypeVar(
    "T_Operation",
    GetInstanceStatus,
    ListModels,
    LoadModelParserModule,
    Create,
    Load,
    Run,
    AddPrompt,
    UpdatePrompt,
    DeletePrompt,
    Save,
    UpdateModel,
    SetParameter,
    SetParameters,
    DeleteParameter,
    SetName,
    SetDescription,
    MockRun,
    contravariant=True,
)


# Cancel is the only command that is not an operation.
class Cancel(core_utils.Record):
    command_name: Literal["cancel"]


Command = Operation | Cancel


class SerializableCommand(core_utils.Record):
    command: Command = Field(..., discriminator="command_name")


class ServerMode(Enum):
    DEBUG_SERVERS = "DEBUG_SERVERS"
    DEBUG_BACKEND = "DEBUG_BACKEND"
    PROD = "PROD"


class ServerBindOutcome(Enum):
    SUCCESS = "SUCCESS"
    PORT_IN_USE = "PORT_IN_USE"
    OTHER_FAILURE = "OTHER_FAILURE"


class EditServerConfig(core_utils.Record, core_utils.EnumValidatedRecordMixin):
    server_port: Optional[int] = None
    aiconfig_path: str = "my_aiconfig.aiconfig.json"
    log_level: str | int = "INFO"
    log_file_path: str = "editor_server_v2.log"
    server_mode: ServerMode = ServerMode.PROD
    parsers_module_path: str = "aiconfig_model_registry.py"


class Response(core_utils.Record):
    instance_id: str
    message: str
    is_success: bool
    aiconfig_instance: AIConfigRuntime | None
    # TODO: make this a more constrained type
    data: Any | None = None

    def to_json(self) -> core_utils.JSONObject:
        return core_utils.JSONObject(
            {
                "instance_id": self.instance_id,
                "message": self.message,
                "is_success": self.is_success,
                "data": self.data,
                "aiconfig": aiconfig_to_json(self.aiconfig_instance),
            }
        )

    def serialize(self) -> str:
        return json.dumps(self.to_json())

    @staticmethod
    def from_error_message(instance_id: str, message: str) -> "Response":
        return Response(
            instance_id=instance_id,
            message=message,
            is_success=False,
            aiconfig_instance=None,
        )


def aiconfig_to_json(aiconfig_instance: AIConfigRuntime | None) -> core_utils.JSONObject | None:
    if aiconfig_instance is None:
        return None
    else:
        EXCLUDE_OPTIONS = {
            "prompt_index": True,
            "file_path": True,
            "callback_manager": True,
        }
        return aiconfig_instance.model_dump(exclude=EXCLUDE_OPTIONS)


class OperationOutput(core_utils.Record):
    # TODO: change the fields
    instance_id: str
    message: str
    is_success: bool
    aiconfig_instance: AIConfigRuntime | None
    # TODO: make this a more constrained type
    data: Any | None = None

    @staticmethod
    def from_method_output(
        instance_id: str, aiconfig_instance: AIConfigRuntime, method_output: Result[Any, str], message_suffix: str = ""
    ) -> "OperationOutput":
        match method_output:
            case Ok(output_ok):
                out = OperationOutput(
                    instance_id=instance_id,
                    message=message_suffix,
                    is_success=True,
                    aiconfig_instance=aiconfig_instance,
                    data={"output": str(output_ok)},
                )
                logger.info(f"{out.instance_id=}, {out.message=}")
                return out
            case Err(e):
                logger.error(f"{e=}")
                return OperationOutput(
                    instance_id=instance_id,
                    message=f"Failed to run prompt: {e}\n{message_suffix}",
                    is_success=False,
                    aiconfig_instance=None,
                )

    def to_json(self) -> core_utils.JSONObject:
        return core_utils.JSONObject(
            {
                "instance_id": self.instance_id,
                "message": self.message,
                "is_success": self.is_success,
                "data": self.data,
                "aiconfig": aiconfig_to_json(self.aiconfig_instance),
            }
        )


class InstanceState(core_utils.Record):
    instance_id: str
    aiconfig_instance: AIConfigRuntime
    aiconfig_path: UnvalidatedPath


@dataclass
class OperationOutcome:
    operation_output: OperationOutput
    instance_state: InstanceState


@dataclass
class ConnectionState:
    websocket: WebSocket


def resolve_path(path: str) -> str:
    return os.path.abspath(os.path.expanduser(path))


def get_validated_path(raw_path: str | None) -> Result[ValidatedPath, str]:
    if not raw_path:
        return Err("No path provided")
    resolved = resolve_path(raw_path)
    if not os.path.isfile(resolved):
        return Err(f"File does not exist: {resolved}")
    return Ok(ValidatedPath(resolved))


T_TaskOutcome = TypeVar("T_TaskOutcome", OperationOutcome, Result[Command, str])


class DoneTask(Generic[T_TaskOutcome]):
    def __init__(self, task: asyncio.Task[T_TaskOutcome]):
        self.task = task


@dataclass
class GlobalState:
    # TODO: is there a better way to pass this into websocket connections?
    editor_config: EditServerConfig
    active_instances: dict[str, ConnectionState]
