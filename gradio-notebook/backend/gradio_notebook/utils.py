"""Simple utils file to be shared across backend"""
import importlib
import os
import sys
from queue import Queue
from types import ModuleType
from typing import Callable

# TODO (rossdan): use common sentinel value in HF extension for end of
# stream instead of implicitly relying on None
STOP_STREAMING_SIGNAL = object()
EXCLUDE_OPTIONS = {
    "prompt_index": True,
    "file_path": True,
    "callback_manager": True,
}
LASTMILE_BASE_URI = "https://lastmileai.dev/"


def show_debug():
    """Flip this to True to see debug messages"""
    return False


def get_validated_path(raw_path: str) -> str:
    resolved = convert_to_absolute_path(raw_path)
    if not os.path.isfile(resolved):
        raise Exception(f"File does not exist: {resolved}")
    return resolved


def import_module_from_path(path_to_module: str) -> ModuleType:
    resolved_path = convert_to_absolute_path(path_to_module)
    module_name = os.path.basename(resolved_path).replace(".py", "")

    spec = importlib.util.spec_from_file_location(module_name, resolved_path)
    if spec is None:
        raise Exception(f"Could not import module from path: {resolved_path}")
    elif spec.loader is None:
        raise Exception(
            f"Could not import module from path: {resolved_path} (no loader)"
        )
    else:
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        return module


def load_register_fn_from_user_module(
    user_module: ModuleType,
) -> Callable[[], None]:
    if not hasattr(user_module, "register_model_parsers"):
        raise Exception(
            f"User module {user_module} does not have a register_model_parsers function."
        )
    register_fn = getattr(user_module, "register_model_parsers")
    if not callable(register_fn):
        raise Exception(
            f"User module {user_module} does not have a register_model_parsers function"
        )
    else:
        return register_fn


def load_user_parser_module(path_to_module: str) -> None:
    print(f"Importing parsers module from {path_to_module}")
    res_user_module = import_module_from_path(path_to_module)
    register_fn = load_register_fn_from_user_module(res_user_module)
    register_fn()


def convert_to_absolute_path(path: str) -> str:
    return os.path.abspath(os.path.expanduser(path))


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
