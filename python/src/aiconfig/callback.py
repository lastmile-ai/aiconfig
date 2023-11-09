# Standard Libraries
import asyncio
import json
import time

# Third Party Libraries
from result import Err, Ok
from pydantic import BaseModel, ConfigDict
from typing import (
    Coroutine,
    Final,
    List,
    Sequence,
    TextIO,
    TypeAlias,
    Union,
    Any,
    Awaitable,
    Callable,
    Optional,
)

# Constants
DEFAULT_TIMEOUT = 5  # Default timeout for callback execution in seconds


class CallbackEvent:
    """
    Represents an event with data to be passed to a callback.
    """

    def __init__(self, name: str, data: Any, ts_ns: int = time.time_ns()):
        self.name = name
        # Anything available at the time the event happens.
        # It is passed to the callback.
        self.data = data
        self.ts_ns = ts_ns


# Type Aliases
Callback = Callable[[CallbackEvent], Awaitable]
Result: TypeAlias = Union[Ok[Any], Err[Any]]


async def execute_coroutine_with_timeout(
    coroutine: Coroutine[Any, Any, Any], timeout: int
) -> Result:
    """
    Execute a coroutine with a timeout, return an Ok result or an Err on Exception

    Args:
        coroutine: The coroutine to execute
        timeout: The timeout in seconds
    
    Returns:
        An Ok result if the coroutine executes successfully or an Err on Exception
    """
    try:
        task = asyncio.create_task(coroutine)
        res = await asyncio.wait_for(task, timeout=timeout)
        return Ok(res)
    except Exception as e:
        return Err(str(e))


class Record(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)


class pydanticBackedCallBackEvent(Record):
    """
    Data class that represents an event that triggers a callback. A copy of CallbackEvent
    but backed by a pydantic model for easy serialization.
    """
    name: str
    data: Any
    ts_ns: int = time.time_ns()


class CallbackManager:
    """
    Manages a sequence of callbacks to be executed in response to Events
    """
    def __init__(self, callbacks: Sequence[Callback], timeout: int = DEFAULT_TIMEOUT) -> None:
        self.callbacks: Final[Sequence[Callback]] = callbacks
        self.results: List[Result] = []
        self.timeout = timeout

    async def run_callbacks(self, event: CallbackEvent) -> None:
        event = pydanticBackedCallBackEvent(**event.__dict__)
        tasks = []
        for callback in self.callbacks:
            task = execute_coroutine_with_timeout(callback(event), self.timeout)
            tasks.append(task)

        self.results = await asyncio.gather(*tasks)

    def clear_results(self) -> None:
        self.results = []

    @classmethod
    def create_default_manager(cls) -> "CallbackManager":
        callback = create_json_logging_callback("callbacks.json")
        return CallbackManager([callback])


def serialize_object_to_json(obj: Any, **kwargs):  # type: ignore [fixme]
    def handle_non_serializable_objects(o: Any):
        return f"<<non-serializable: {type(o).__qualname__}>>"

    return json.dumps(obj, default=handle_non_serializable_objects, **kwargs)


def create_json_logging_callback(file: Union[str, TextIO]) -> Callback:
    """
    Higher-order function that returns a callback that writes events to a file.

    Args:
        file: Either a file path or a file object to write to.

    Returns:
        A callback that writes events to the specified file.
    """

    def write_event_to_file(event: CallbackEvent, file: TextIO) -> int:
        data_event = event.model_dump()
        data_write = dict(**data_event)
        return file.write("\n" + serialize_object_to_json(data_write, indent=2))

    async def _callback(event: CallbackEvent) -> Any:
        if isinstance(file, str):
            with open(file, "a+") as f:
                result = write_event_to_file(event, f)
                return result
        else:
            result = write_event_to_file(event, file)
            return result

    return _callback
