from abc import abstractmethod
from dataclasses import dataclass
import json
from pathlib import Path
import shlex
import time
from typing import Any, Callable, NewType, Protocol
import lastmile_utils.lib.core.api as core_utils

import dotenv
import pytest
from websocket import WebSocket, create_connection  # type: ignore
import aiconfig.editor.server.server_v2_common as server_common
from xprocess import ProcessStarter, XProcess

RunningServerConfig = NewType("RunningServerConfig", server_common.EditServerConfig)


@dataclass
class ConnectedWebsocket:
    websocket: WebSocket
    running_server: RunningServerConfig


class GetConnectedWebsocketFn(Protocol):
    @abstractmethod
    def __call__(self, edit_config: server_common.EditServerConfig) -> ConnectedWebsocket:
        pass


def _get_cli_command(subcommand_cfg: server_common.EditServerConfig) -> list[str]:
    match subcommand_cfg:
        case server_common.EditServerConfig(
            #
            server_port=server_port_,
            aiconfig_path=aiconfig_path_,
            server_mode=server_mode_,
            parsers_module_path=parsers_module_path_,
        ):
            subcommand = "edit"
            str_server_mode = server_mode_.name.lower()
            cmd = shlex.split(
                f"""
                python -m 'aiconfig.scripts.aiconfig_cli_v2' {subcommand} \
                    --server-port={server_port_} \
                    --server-mode={str_server_mode} \
                    --aiconfig-path={aiconfig_path_} \
                    --parsers-module-path={parsers_module_path_}
                """
            )
            return cmd


def _make_edit_config(**kwargs) -> server_common.EditServerConfig:  # type: ignore
    TEST_PORT = 8011
    defaults = dict(
        server_port=TEST_PORT,
        server_mode=server_common.ServerMode.DEBUG_BACKEND,
        parsers_module_path="aiconfig.model_parser",
    )
    given_kwargs: dict[str, Any] = kwargs
    new_kwargs = core_utils.dict_union_allow_replace(defaults, given_kwargs, on_conflict="replace")
    return server_common.EditServerConfig(**new_kwargs)


def _make_connected_websocket(get_connected_websocket: GetConnectedWebsocketFn, edit_config: server_common.EditServerConfig) -> ConnectedWebsocket:
    connected_websocket = get_connected_websocket(edit_config)
    running_server = connected_websocket.running_server
    assert running_server.aiconfig_path == edit_config.aiconfig_path
    return connected_websocket


def _make_default_connected_websocket(get_connected_websocket: GetConnectedWebsocketFn, tmp_path: Path) -> ConnectedWebsocket:
    the_path = (tmp_path / "the.aiconfig.json").as_posix()
    edit_config = _make_edit_config(aiconfig_path=the_path)
    return _make_connected_websocket(get_connected_websocket, edit_config)


def _load_aiconfig(websocket: WebSocket) -> dict[str, Any]:
    ws_send_command(websocket, "load", dict())
    resp = ws_receive_response(websocket)
    assert resp is not None
    return resp["aiconfig"]


@pytest.fixture
def get_running_server(xprocess: XProcess, request: pytest.FixtureRequest):
    def _make(edit_config: server_common.EditServerConfig):
        class Starter(ProcessStarter):
            @property
            def pattern(self):  # type: ignore
                return "Running on http://127.0.0.1"

            # command to start process
            @property
            def args(self):  # type: ignore
                return _get_cli_command(edit_config)

            terminate_on_interrupt = True

        # ensure process is running and return its logfile
        pid, logfile = xprocess.ensure("myserver", Starter)  # type: ignore
        print(f"{logfile=}")

        dotenv.load_dotenv()

        def cleanup():
            # clean up whole process tree afterwards
            xprocess.getinfo("myserver").terminate()  # type: ignore

        request.addfinalizer(cleanup)

        return RunningServerConfig(edit_config)

    return _make


@pytest.fixture
def get_connected_websocket(get_running_server: Callable[[server_common.EditServerConfig], RunningServerConfig], request: pytest.FixtureRequest):
    def _make(edit_config: server_common.EditServerConfig):
        running_server = get_running_server(edit_config)
        url = f"ws://localhost:{running_server.server_port}/ws_manage_aiconfig_instance"
        ws = create_connection(url)
        synchronize_with_server(ws)

        def cleanup():
            ws.close()

        request.addfinalizer(cleanup)
        return ConnectedWebsocket(websocket=ws, running_server=running_server)

    return _make


def ws_send_command(websocket: WebSocket, command_name: str, command_params: dict[str, Any]):
    command_json_obj = dict(command_name=command_name, **command_params)
    message_obj = {"command": command_json_obj}
    cmd_str = json.dumps(message_obj)
    res = websocket.send_text(cmd_str)
    print(f"sent {cmd_str=}, {res=}")
    return res


def ws_receive_response(websocket: WebSocket) -> dict[str, Any] | None:
    resp_str = websocket.recv()
    if not resp_str:
        return None
    resp = json.loads(resp_str)
    return resp


def synchronize_with_server(websocket: WebSocket):
    """Send a command and wait for response
    to make sure server is initialized and websocket is set up."""
    ws_send_command(
        websocket,
        "mock_run",
        command_params=dict(seconds=0.2),
    )
    _sync_resp = ws_receive_response(websocket)
    # print(f"{sync_resp=}")


def test_editor_server_start_new_file(get_connected_websocket: GetConnectedWebsocketFn, tmp_path: Path):
    the_path = (tmp_path / "the.aiconfig.json").as_posix()
    edit_config = _make_edit_config(aiconfig_path=the_path)
    assert core_utils.load_json_file(the_path).is_err()
    connected_websocket = _make_connected_websocket(get_connected_websocket, edit_config)
    assert connected_websocket.running_server.aiconfig_path == the_path

    running_server = connected_websocket.running_server

    assert core_utils.load_json_file(running_server.aiconfig_path).is_ok()


def _get_mock_default_prompt(prompt_num: int) -> dict[str, Any]:
    return dict(name=str(prompt_num), input=f"mock_prompt_{prompt_num}", metadata=None, outputs=[])


def test_editor_mock_run_simple(get_connected_websocket: GetConnectedWebsocketFn, tmp_path: Path):
    connected_websocket = _make_default_connected_websocket(get_connected_websocket, tmp_path)
    websocket = connected_websocket.websocket
    ws_send_command(websocket, "mock_run", dict(seconds=0.3))
    resp = ws_receive_response(websocket)
    assert resp is not None
    message, is_success, aiconfig, _data = resp["message"], resp["is_success"], resp["aiconfig"], resp["data"]
    assert is_success
    # synchronize_with_server runs mock_run with 0.2 seconds, which adds
    # prompts 1 and 2.
    # This command is expected to add 3 and 4.
    assert message == "Blocked for 0.3 seconds and added prompts 3, 4"
    prompts = aiconfig.get("prompts", [])
    assert prompts == [_get_mock_default_prompt(i + 1) for i in range(4)]
    print("Done")


def test_editor_mock_run_cancel_rollback_1(get_connected_websocket: GetConnectedWebsocketFn, tmp_path: Path):
    """Cancel immediately, before any mutation can happen"""
    connected_websocket = _make_default_connected_websocket(get_connected_websocket, tmp_path)
    websocket = connected_websocket.websocket

    aiconfig_before = _load_aiconfig(websocket)
    print(f"{aiconfig_before=}")

    ws_send_command(websocket, "mock_run", dict(seconds=0.3))
    ws_send_command(websocket, "cancel", dict())
    cancel_resp = ws_receive_response(websocket)
    print(f"{cancel_resp=}")
    ws_send_command(websocket, "load", dict())
    aiconfig_after = _load_aiconfig(websocket)
    assert aiconfig_before == aiconfig_after


def test_editor_mock_run_cancel_rollback_2(get_connected_websocket: GetConnectedWebsocketFn, tmp_path: Path):
    """wait until some mutation happens, then cancel"""
    connected_websocket = _make_default_connected_websocket(get_connected_websocket, tmp_path)
    websocket = connected_websocket.websocket

    aiconfig_before = _load_aiconfig(websocket)
    print(f"{aiconfig_before=}")

    ws_send_command(websocket, "mock_run", dict(seconds=0.3))

    # mock run does its first mutation after 0.1 seconds.
    # Waiting 0.2 before canceling allows it to happen, testing rollback.
    time.sleep(0.2)
    ws_send_command(websocket, "cancel", dict())
    cancel_resp = ws_receive_response(websocket)
    print(f"{cancel_resp=}")
    aiconfig_after = _load_aiconfig(websocket)
    assert aiconfig_before == aiconfig_after, f"{aiconfig_before=}, {aiconfig_after=}"


def test_editor_mock_run_cancel_fast_walltime(get_connected_websocket: GetConnectedWebsocketFn, tmp_path: Path):
    """wait until some mutation happens, then cancel"""
    connected_websocket = _make_default_connected_websocket(get_connected_websocket, tmp_path)
    websocket = connected_websocket.websocket

    # Control: block for 0.4 seconds, don't cancel
    ts_start = time.time()
    ws_send_command(websocket, "mock_run", dict(seconds=0.4))
    _mock_run_resp = ws_receive_response(websocket)
    ts_end = time.time()
    s_elapsed = ts_end - ts_start
    print(f"[control]{s_elapsed=}")
    assert s_elapsed >= 0.4

    ts_start = time.time()
    ws_send_command(websocket, "mock_run", dict(seconds=0.4))
    # Cancel almost immediately
    time.sleep(0.1)
    ws_send_command(websocket, "cancel", dict())
    cancel_resp = ws_receive_response(websocket)
    ts_end = time.time()
    s_elapsed = ts_end - ts_start
    print(f"[cancel]{s_elapsed=}")
    assert 0.1 < s_elapsed < 0.11

    assert cancel_resp is not None
    assert cancel_resp["message"] == "Cancelling command"
    assert cancel_resp["is_success"] == True

    ts_start = time.time()
    ws_send_command(websocket, "mock_run", dict(seconds=0.2))
    resp_run_again = ws_receive_response(websocket)
    ts_end = time.time()
    s_elapsed = ts_end - ts_start
    print(f"[run again]{s_elapsed=}")

    assert resp_run_again is not None
    message, is_success, aiconfig, _data = (
        resp_run_again["message"],
        resp_run_again["is_success"],
        resp_run_again["aiconfig"],
        resp_run_again["data"],
    )
    assert is_success
    assert "Blocked for 0.2 seconds and added prompts" in message, message


def test_editor_real_run_cancel_fast_walltime(get_connected_websocket: GetConnectedWebsocketFn):
    edit_config = _make_edit_config(aiconfig_path="/Users/jonathan/Projects/aiconfig/python/src/aiconfig/editor/travel.aiconfig.json")
    connected_websocket = _make_connected_websocket(get_connected_websocket, edit_config)

    websocket = connected_websocket.websocket

    ts_start = time.time()
    ws_send_command(websocket, "run", dict(prompt_name="get_activities"))
    _run_resp = ws_receive_response(websocket)
    ts_end = time.time()
    s_elapsed = ts_end - ts_start
    print(f"[control]{s_elapsed=}")
    print(f"{_run_resp=}")

    assert s_elapsed >= 2, f"{s_elapsed=}"

    ts_start = time.time()
    ws_send_command(websocket, "run", dict(prompt_name="get_activities"))
    # Cancel almost immediately - give it time to start
    time.sleep(0.5)
    ws_send_command(websocket, "cancel", dict())
    cancel_resp = ws_receive_response(websocket)
    ts_end = time.time()
    s_elapsed = ts_end - ts_start
    print(f"[cancel]{s_elapsed=}, {cancel_resp=}")
    assert 0.5 < s_elapsed < 2

    assert cancel_resp is not None
    assert cancel_resp["message"] == "Cancelling command", f"{cancel_resp=}"
    assert cancel_resp["is_success"] == True

    ts_start = time.time()
    ws_send_command(websocket, "run", dict(prompt_name="get_activities"))
    _run_resp = ws_receive_response(websocket)
    ts_end = time.time()
    s_elapsed = ts_end - ts_start
    print(f"[run again]{s_elapsed=}")
    print(f"{_run_resp=}")


def test_operation_exception(get_connected_websocket: GetConnectedWebsocketFn, tmp_path: Path):
    connected_websocket = _make_default_connected_websocket(get_connected_websocket, tmp_path)
    websocket = connected_websocket.websocket
    ws_send_command(websocket, "mock_run", dict(seconds=0.3, do_raise=True))
    resp = ws_receive_response(websocket)
    assert resp is not None
    message, is_success, _aiconfig, _data = resp["message"], resp["is_success"], resp["aiconfig"], resp["data"]
    assert not is_success, f"{resp=}"
    assert message == "Raised an exception as requested", f"{resp=}"
