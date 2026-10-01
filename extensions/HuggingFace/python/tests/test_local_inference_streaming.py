import importlib.util
from queue import Queue
from pathlib import Path
from types import ModuleType

import pytest


def load_local_inference_util() -> ModuleType:
    util_path = (
        Path(__file__).parents[1]
        / "src"
        / "aiconfig_extension_hugging_face"
        / "local_inference"
        / "streaming.py"
    )
    spec = importlib.util.spec_from_file_location("hf_local_inference_util", util_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


_util = load_local_inference_util()
finish_streaming_thread = _util.finish_streaming_thread
run_inference_with_streamer = _util.run_inference_with_streamer


class FakeStreamer:
    _end = object()

    def __init__(self):
        self.items = Queue()

    def end(self):
        self.items.put(self._end)

    def __iter__(self):
        while True:
            item = self.items.get()
            if item is self._end:
                return
            yield item


def test_streaming_worker_exception_ends_consumer_and_is_raised():
    streamer = FakeStreamer()

    def fail_inference():
        streamer.items.put("partial output")
        raise RuntimeError("model failed")

    thread, errors = run_inference_with_streamer(fail_inference, streamer)

    assert list(streamer) == ["partial output"]
    with pytest.raises(RuntimeError, match="model failed"):
        finish_streaming_thread(thread, errors)

    assert not thread.is_alive()
