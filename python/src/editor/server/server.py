from dataclasses import dataclass
import logging
import sys
from typing import Any, Optional

import lastmile_utils.lib.core.api as core_utils
from flask import Flask, session
from result import Ok, Result

from aiconfig import AIConfigRuntime

log = logging.getLogger("werkzeug")
log.disabled = True
cli = sys.modules["flask.cli"]

logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)


class EditConfig(core_utils.Record):
    server_port: int = 8888
    aiconfig_path: Optional[str] = None
    log_level: str | int = "INFO"


app = Flask(__name__, static_url_path="")

@dataclass
class ServerState:
    count = 0


def _get_server_state(app: Flask) -> ServerState:
    return app.server_state # type: ignore


@app.route("/")
def home():
    ss = _get_server_state(app)
    ss.count += 1
    print("Count:", ss.count)
    # server_state = _get_server_state(session)
    # print(server_state)
    # LOGGER.info("Count: %s", server_state.count)
    # server_state.count += 1
    return app.send_static_file("index.html")


def run_server(edit_config: EditConfig) -> Result[int, str]:
    app.server_state = ServerState() # type: ignore
    LOGGER.setLevel(edit_config.log_level)
    LOGGER.info("Edit config: %s", edit_config)
    LOGGER.info(f"Editor server running on http://localhost:{edit_config.server_port}")
    app.run(port=edit_config.server_port)
    return Ok(0)
