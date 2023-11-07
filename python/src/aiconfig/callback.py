import logging
from typing import Final, List, Sequence


class event:
    data: any


class startEvent(event):
    action: str


class endEvent(event):
    action: str


class callbackHandler:
    pass


# Don't rely on the generic type. Wrong annotation might be missed.
# Use `Any` to signal that uncertainty explicitly.
import time
from typing import Any, Awaitable, Callable, Optional, TypeVar

import numpy.typing as npt
from pydantic import BaseModel, ConfigDict


# TODO [P1]: is this useful?
NPA = npt.NDArray[Any]

ArrayLike = npt.ArrayLike


# Canonical typevar for generator params
T = TypeVar("T")

# Canonical typevar for generator return type
R = TypeVar("R")

# Canonical typevar for retriever query type
Q = TypeVar("Q")

# Canonical typevar for params
P = TypeVar("P")


class Record(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)


class CallbackEvent(Record):
    name: str
    # Anything available at the time the event happens.
    # It is passed to the callback.
    data: Any
    ts_ns: int = time.time_ns()


class CallbackResult(Record):
    result: Any




class CallbackManager:
    def __init__(self, callbacks: List[Callable[[CallbackEvent], Any]]) -> None:
        self.callbacks = callbacks


    def run_callbacks(self, event: CallbackEvent) -> None:
        # Runs all callbacks with the given event.
        for callback in self.callbacks:
            callback(event)
            


