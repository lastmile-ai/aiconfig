import asyncio
import json
import logging
from typing import Coroutine, Final, List, Sequence, TextIO, TypeAlias, Union

from result import Err, Ok


# Don't rely on the generic type. Wrong annotation might be missed.
# Use `Any` to signal that uncertainty explicitly.
import time
from typing import Any, Awaitable, Callable, Optional, TypeVar

from pydantic import BaseModel, ConfigDict


class Record(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)


class CallbackEvent:
    def __init__(self, name: str, data: Any, ts_ns: int = time.time_ns()):
        self.name = name
        # Anything available at the time the event happens.
        # It is passed to the callback.
        self.data = data
        self.ts_ns = ts_ns


class CallbackResult(Record):
    result: Any


# Callbacks will run on every event
# They may have I/O side effects (e.g. logging) and/or return a CallbackResult.
# Any CallbackResults returned will be stored in the CallbackManager.
# The user can then access these results.
Callback = Callable[[CallbackEvent, str], Awaitable]
Result: TypeAlias = Union[Ok[Any], Err[Any]]


async def run_thunk_safe(thunk: Coroutine[Any, Any, Any], timeout: int) -> Any:
    try:
        task = asyncio.create_task(thunk)
        res = await asyncio.wait_for(task, timeout=timeout)
        return Ok(res)
    except BaseException as e:  # type: ignore
        return Err(str(e))


class CallbackManager:
    def __init__(self, callbacks: Sequence[Callback]) -> None:
        self.callbacks: Final[Sequence[Callback]] = callbacks
        self.reset_run_state()

    async def run_callbacks(self, event: CallbackEvent) -> None:
        for callback in self.callbacks:

            async def _thunk():
                return await callback(event, self.run_id)

            result = await run_thunk_safe(_thunk(), timeout=1)
            self.results.append(result)

    def reset_run_state(self, run_id: Optional[str] = None) -> None:
        self.results = []

    @classmethod
    def default(cls) -> "CallbackManager":
        return CallbackManager([to_json("/var/logs/callbacks.json")])


def safe_serialize_json(obj: Any, **kwargs):  # type: ignore [fixme]
    def default(o: Any):
        return f"<<non-serializable: {type(o).__qualname__}>>"

    return json.dumps(obj, default=default, **kwargs)


def to_json(file: Union[str, TextIO]):
    def _write(event: CallbackEvent, run_id: str, file: TextIO) -> int:
        data_event = event.model_dump()
        data_write = dict(run_id=run_id, **data_event)
        return file.write("\n" + safe_serialize_json(data_write, indent=2))

    async def _callback(event: CallbackEvent, run_id: str) -> Optional[CallbackResult]:
        if isinstance(file, str):
            with open(file, "a+") as f:
                result = _write(event, run_id, f)
                return CallbackResult(result=result)
        else:
            result = _write(event, run_id, file)
            return CallbackResult(result=result)

    return _callback
