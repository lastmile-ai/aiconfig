import os
import lastmile_utils.lib.core.api as core_utils
import sys
import time
import itertools
import numpy as np
from result import Ok, Result

logger = core_utils.get_logger(__name__)


class RageConfig(core_utils.Record):
    log_level: str | int = "WARNING"


def rage(config: RageConfig) -> Result[None, str]:
    logger.setLevel(config.log_level)
    print("Raging...")
    spin(2)
    print("Please hold. Your call is important to us.\nA representative will be with you shortly.")
    spin(3, type="music")
    print("Looking for your server logs...")
    spin(4, type="music")
    print("Turning up the heat...")
    spin(2)
    print("If I had a dollar for every time I've seen this error...")
    spin(5)
    print("I'm glad we're finally spending time together.")
    spin(4, type="music")
    print("Please continue holding. We appreciate your continued support, or whatever.")
    spin(3, type="music")

    print("\n\n\n\n............\n\n")
    print("Please open an issue! :) Here are some tips on how to do that:")
    for logfile in ["editor_flask_server.log", "aiconfig.log"]:
        print()
        if os.path.exists(logfile):
            print(f"Found {logfile}! Please include its contents in your bug report.")
            print(f"Full path: {os.path.abspath(logfile)}")
        else:
            print(f"No {logfile} found. This might be another bug :)")
            print("For now, please include your terminal output in your bug report.")

    print("\nPlease run the following commands and also include their output:")
    print("\nwhich pip; which pip3; which python; which python3; pip3 list | grep aiconfig; python --version; python3 --version")

    print("\nPlease open an issue here: https://github.com/lastmile-ai/aiconfig/issues/new")
    print("Our sincerest apologies and gratitude. We will comment on the issue as soon as possible.")
    print("\n\n")
    print("Done raging! :)")
    print("\n\n")

    return Ok(None)


def spin(seconds: int, type: str = "spinner"):
    """This is just for fun."""

    assert type in ["spinner", "music"]

    spinning = itertools.cycle(["-", "/", "|", "\\"])

    def get_animation():
        if type == "spinner":
            return next(spinning)
        else:
            return "".join(np.random.choice(["♩", "♫", "♬", "♪"]) for _ in range(5))

    end_time = time.time() + seconds

    while time.time() < end_time:
        sys.stdout.write(get_animation())
        sys.stdout.flush()
        time.sleep(0.1)
        sys.stdout.write("\b" * 5)
