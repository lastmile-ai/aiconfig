# Standard Libraries
import asyncio
import logging
import time
from typing import (
    Any,
    Awaitable,
    Callable,
    Coroutine,
    Final,
    List,
    Sequence,
    TypeAlias,
    Union,
)

from pydantic import BaseModel, ConfigDict

# Third Party Libraries
from result import Err, Ok

# Constants
DEFAULT_TIMEOUT = 5  # Default timeout for callback execution in seconds


class CallbackEvent:
    """
    Represents an event with data to be passed to a callback.
    """

    def __init__(self, name: str, file: str, data: Any, ts_ns: int = time.time_ns()):
        self.name = name
        # The name of the file that triggered the event.
        self.file = file
        # Anything available at the time the event happens.
        # It is passed to the callback.
        self.data = data
        self.ts_ns = ts_ns

I break the build

# Type Aliases
Callback = Callable[[CallbackEvent], Awaitable[Any]]
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


class CallbackEventModel(Record):
    """
    Data class that represents an event that triggers a callback. A copy of CallbackEvent
    but backed by a pydantic model for easy serialization.
    """

    name: str
    file: str
    data: Any
    ts_ns: int = time.time_ns()


class CallbackManager:
    """
    Manages a sequence of callbacks to be executed in response to Events
    """

    def __init__(self, callbacks: Sequence[Callback], timeout: int = None) -> None:
        if timeout is None:
            timeout = DEFAULT_TIMEOUT
        self.callbacks: Final[Sequence[Callback]] = callbacks
        self.results: List[Result] = []
        self.timeout = timeout

    async def run_callbacks(self, event: CallbackEvent) -> None:
        event = CallbackEventModel(**event.__dict__)
        tasks = []
        for callback in self.callbacks:
            task = execute_coroutine_with_timeout(callback(event), self.timeout)
            tasks.append(task)

        self.results = await asyncio.gather(*tasks)

    @classmethod
    def create_default_manager(cls) -> "CallbackManager":
        """
        Creates a default callback manager that logs events to file 'callbacks.json.
        """
        callback = create_logging_callback("aiconfig.log")
        return CallbackManager([callback])


# Default Callback Manager Logger to file
def create_logging_callback(log_file: str = None) -> Callback:
    """
    Creates a callback that logs the event to a file.
    """
    if log_file is None:
        log_file = "callbacks.log"

    def setup_logger():
        level = logging.DEBUG
        name = "my-logger"
        log_file = "aiconfig.log"

        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        handler = logging.FileHandler(log_file)
        handler.setFormatter(formatter)

        logger = logging.getLogger(name)
        logger.setLevel(level)
        logger.addHandler(handler)
        return logger

    logger = setup_logger()

    def callback_handler(event):
        logger.info(f"Callback called. event\n: {event}")

    return callback_handler
