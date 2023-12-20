from dataclasses import dataclass
import logging
from typing import Optional

import lastmile_utils.lib.core.api as core_utils
from flask import Flask
from result import Err, Ok, Result


logging.getLogger("werkzeug").disabled = True

logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)


class EditConfig(core_utils.Record):
    server_port: int = 8080
    aiconfig_path: Optional[str] = None
    log_level: str | int = "INFO"
    server_mode: str


app = Flask(__name__, static_url_path="")


@dataclass
class ServerState:
    count = 0


def _get_server_state(app: Flask) -> ServerState:
    return app.server_state  # type: ignore


@app.route("/")
def home():
    ss = _get_server_state(app)
    ss.count += 1
    print("Count:", ss.count)
    LOGGER.info("Count: %s", ss.count)
    return app.send_static_file("index.html")


@app.route("/test")
def test():
    return {"key": 2}


def run_backend_server(edit_config: EditConfig) -> Result[int, str]:
    app.server_state = ServerState()  # type: ignore
    LOGGER.setLevel(edit_config.log_level)
    LOGGER.info("Edit config: %s", edit_config.model_dump_json())
    LOGGER.info(f"Editor server running on http://localhost:{edit_config.server_port}")

    if edit_config.server_mode not in {"debug", "prod"}:
        return Err(f"Unknown server mode: {edit_config.server_mode}")

    debug = edit_config.server_mode == "debug"
    app.run(port=edit_config.server_port, debug=debug)
    return Ok(0)
