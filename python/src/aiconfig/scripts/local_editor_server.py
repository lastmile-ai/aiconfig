import asyncio
import logging
import sys
from typing import Optional

import lastmile_utils.lib.core.api as core_utils
import tornado
from result import Err, Ok, Result

logging.basicConfig(format=core_utils.LOGGER_FMT)
LOGGER = logging.getLogger(__name__)


class Serverserver_config(core_utils.Record):
    port: int = 8888
    server_config_path: Optional[str] = None
    log_level: str = "INFO"


def _make_handler(server_config: Serverserver_config):
    class MainHandler(tornado.web.RequestHandler):
        def get(self):
            self.write(f"path: {server_config.server_config_path}")

    return MainHandler


def make_app(server_config: Serverserver_config):
    return tornado.web.Application(
        [
            (r"/", _make_handler(server_config)),
        ]
    )


async def main(argv: list[str]) -> int:
    parser = core_utils.argparsify(Serverserver_config)
    res_server_config = core_utils.parse_args(parser, argv[1:], Serverserver_config)
    final_result = await res_server_config.and_then_async(run_server)
    match final_result:
        case Ok(msg):
            LOGGER.info("Ok:\n%s", msg)
            return 0
        case Err(e):
            LOGGER.critical("err: %s", e)
            return core_utils.result_to_exitcode(Err(e))
    return core_utils.result_to_exitcode(final_result)


async def run_server(server_config: Serverserver_config) -> Result[int, str]:
    LOGGER.setLevel(server_config.log_level or "INFO")
    app = make_app(server_config)
    app.listen(server_config.port)
    LOGGER.info(f"Listening on localhost:{server_config.port}")
    try:
        _ = await asyncio.Event().wait()
        return Ok(0)
    except KeyboardInterrupt:
        return Ok(1)


if __name__ == "__main__":
    retcode: int = asyncio.run(main(sys.argv))
    sys.exit(retcode)
