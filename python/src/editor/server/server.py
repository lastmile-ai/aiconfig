import logging
import sys
from typing import Optional

import lastmile_utils.lib.core.api as core_utils
from flask import Flask
from result import Ok, Result

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


@app.route("/")
def home():
    return app.send_static_file("index.html")


def run_server(edit_config: EditConfig) -> Result[int, str]:
    LOGGER.setLevel(edit_config.log_level)
    LOGGER.info("Edit config: %s", edit_config)
    LOGGER.info(f"Editor server running on http://localhost:{edit_config.server_port}")
    app.run(port=edit_config.server_port)
    return Ok(0)
