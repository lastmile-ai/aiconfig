import threading
from typing import Any, Callable


def run_inference_with_streamer(
    inference: Callable[[], Any], streamer: Any
) -> tuple[threading.Thread, list[BaseException]]:
    """Run inference in a worker and close its stream if it fails.

    TextIteratorStreamer consumers wait for an end-of-stream signal. Model
    exceptions raised in the worker otherwise leave the consumer blocked.
    Callers should consume the stream, then call ``finish_streaming_thread``
    to join the worker and re-raise any inference exception.
    """
    errors: list[BaseException] = []

    def run() -> None:
        try:
            inference()
        except BaseException as error:
            errors.append(error)
            streamer.end()

    thread = threading.Thread(target=run)
    thread.start()
    return thread, errors


def finish_streaming_thread(thread: threading.Thread, errors: list[BaseException]) -> None:
    """Join an inference worker and re-raise its exception in the caller."""
    thread.join()
    if errors:
        raise errors[0]
