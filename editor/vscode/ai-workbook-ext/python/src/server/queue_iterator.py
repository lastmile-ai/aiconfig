"""Queue iterator for streaming. Can only process strings for now
but in future will try to make it generic"""
# import asyncio
from queue import Queue

# from typing import Generic, TypeVar

# # TODO: Add generic typing for queue items
# # (couldn't get sentinel value to work with generics)
# T = TypeVar('T')
STOP_STREAMING_SIGNAL = object()  # sentinel value to indicate end of stream


class QueueIterator:
    """In order to support text streaming, we need to store
    the output in a queue and iterate over those values. A lot of this was
    inspired by HuggingFace's TextIteratorStreamer object:

    I know I can just use a queue directly in the callsite with
    `iter(queue.get, None)`, but having a class makes it easier to manage
    and abstracts it a bit more.
    """

    def __init__(self):
        self.q = Queue()
        self.stop_signal = STOP_STREAMING_SIGNAL
        self.timeout = None

    def __iter__(self):
        return self

    def __next__(self):
        value = self.q.get(block=True, timeout=self.timeout)
        if value == self.stop_signal:
            raise StopIteration()
        return value

    def put(self, text: str, stream_end: bool = False):
        self.q.put(text, timeout=self.timeout)
        if stream_end:
            self.q.put(self.stop_signal, timeout=self.timeout)

    def isEmpty(self) -> bool:
        return self.q.empty()
