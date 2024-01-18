import itertools
import os
import platform
import shlex
import subprocess
import sys
import time
import webbrowser
from textwrap import dedent
from urllib.parse import quote

import lastmile_utils.lib.core.api as core_utils
import numpy as np
from result import Err, Ok, Result

logger = core_utils.get_logger(__name__)


class RageConfig(core_utils.Record):
    log_level: str | int = "WARNING"


def rage(config: RageConfig) -> Result[None, str]:
    logger.setLevel(config.log_level)
    print("Raging...")
    _troll_the_user_part_1()
    print("\n\n\n\n............\n\n")
    print("Please open an issue! :) Here's a template:")
    out = _create_issue_draft()

    print("Our sincerest apologies and gratitude. If you opened an issue, will comment on it as soon as possible.")
    print("\n\n")

    print("Done raging! :)")
    return out


def _try_run_command(command: str) -> Result[str, str]:
    """
    Split the command using shlex, then run. Try to capture stdout and stderr.
    If anything goes wrong, return a string indicating that issue and ask the user to run the command manually.
    If command succeeds, create a well-formatted string containing stdout and stderr.
    """

    # Split the command into shell-like syntax
    cmd_parts = shlex.split(command)

    # Try to execute the command and capture output
    try:
        process = subprocess.Popen(cmd_parts, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()

        # Decode bytes to string and return formatted message
        stdout_str = stdout.decode().strip()
        stderr_str = stderr.decode().strip()

        return Ok(f"\nSTDOUT:\n'{stdout_str}'\nSTDERR:\n'{stderr_str}'")

    except Exception as e:
        return core_utils.ErrWithTraceback(e)


def _fmt_command_input_output(command: str, command_output: Result[str, str]) -> str:
    command_output_str = command_output.unwrap_or("Couldn't run command :(. Please run manually.")
    return dedent(
        f"""
            Command: {command}
            Output: {command_output_str}
            """
    )


def _create_issue_draft() -> Result[None, str]:
    title = "Bug Report [TODO: brief description]"
    server_log_path = _look_for_log("editor_flask_server.log")
    aiconfig_log_path = _look_for_log("aiconfig.log")
    server_log_str = f"see {server_log_path}" if server_log_path else "Couldn't find the log file :( Check your terminal output"
    aiconfig_log_str = f"see {aiconfig_log_path}" if aiconfig_log_path else "Couldn't find the log file :( Check your terminal output"

    commands_to_run = [
        "which pip",
        "which pip3",
        "which python",
        "which python3",
        "python --version",
        "python3 --version",
    ]
    command_inputs_outputs = dedent("\n\n".join(_fmt_command_input_output(command, _try_run_command(command)) for command in commands_to_run))
    pip_list_output = _get_pip_list_filtered()
    body = dedent(
        f"""
        This is a rage-generated bug report. Like an ordinary bug report, but with more rage.

        * With markdown
        * Cool, huh?

        [add detailed description here]
        [provide steps to reproduce (what were you doing, what did you expect to happen, what happened instead?)]
        [paste server log contents ({server_log_str})]
        [paste aiconfig log contents ({aiconfig_log_str})]]

        =====================
        OS: {platform.system()} {platform.release()}
        Python: {sys.version}
        =====================
        {command_inputs_outputs}
        {pip_list_output}

        """
    )
    print("\n\n\n\nIssue draft:\n\n")
    print(f"Title: {title}")
    print(f"Body:\n{body}")
    open_draft = _get_yes_or_no_input("Would you like to open a draft issue in your browser? [Y/n] ")
    if open_draft:
        _troll_the_user_part_2()
        _open_github_issue_draft(
            repo="lastmile-ai/aiconfig",
            title=title,
            body=body,
            labels=["type: bug", "status: planned"],
        )
    else:
        print("Copy. That's why you're the idea guy or gal.")

    return Ok(None)


def _get_pip_list_filtered() -> str:
    output = _try_run_command("pip3 list")
    match output:
        case Ok(output_str):
            filtered_lines = [line for line in output_str.split("\n") if "aiconfig" in line.lower()]
            filtered_str = Ok("aiconfig packages:\n" + "\n".join(filtered_lines))
            return _fmt_command_input_output("pip3 list", filtered_str)
        case Err(_):
            return "\nCommand: pip3 list | grep aiconfig\nCouldn't run command :(. Please run manually."


def _look_for_log(logfile: str) -> str | None:
    print()
    if os.path.exists(logfile):
        print(f"Found {logfile}! Please include its contents in your bug report.")
        return os.path.abspath(logfile)
    else:
        print(f"No {logfile} found. This might be another bug :)")
        print("For now, please include your terminal output in your bug report.")
        return None


def _get_yes_or_no_input(prompt: str = "Y/n"):
    while True:
        resp = input(prompt)
        resp = resp.lower().strip()
        if resp in ["y", "yes"]:
            return True
        elif resp in ["n", "no"]:
            return False
        else:
            print("Invalid input. Please enter Y or N.")


def _spin(seconds: int, type: str = "spinner"):
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


def _troll_the_user_part_1():
    _spin(2)
    print("Please hold. Your call is important to us.\nA representative will be with you shortly.")
    _spin(3, type="music")
    print("Looking for your server logs...")
    _spin(4, type="music")
    print("Turning up the heat...")
    _spin(2)
    print("If I had a dollar for every time I've seen this error...")
    _spin(5)
    print("I'm glad we're finally spending time together.")
    _spin(4, type="music")
    print("Please continue holding. We appreciate your continued support, or whatever.")
    _spin(3, type="music")


def _troll_the_user_part_2():
    print("Sure thing, boss!")
    _spin(2)
    print("Entering launch codes...")
    _spin(3)
    print("Grabbing a covfefe...")
    _spin(2)
    print("Declassifying documents...")
    _spin(3)


def _open_github_issue_draft(repo: str, title: str, body: str, labels: list[str] | None = None) -> bool:
    base_url = f"https://github.com/{repo}/issues/new"
    title_str = f"title={quote(title)}"
    body_str = f"body={quote(body)}"
    labels_str = f"labels={','.join([quote(label) for label in labels])}" if labels else ""

    issue_url = f"{base_url}?{title_str}&{body_str}&{labels_str}"
    try:
        webbrowser.open(issue_url)
        return True
    except Exception as e:
        logger.debug(f"exn={e}")
        logger.warning(f"Couldn't open your browser for you. I guess you'll have to do it yourself :)")
        logger.warning(f"Please open an issue here: {issue_url}")
        return False
