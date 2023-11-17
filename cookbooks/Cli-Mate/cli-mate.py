from dataclasses import dataclass
from textwrap import dedent
import warnings

from result import Err, Ok, Result

warnings.filterwarnings("ignore")

import asyncio
from asyncio import AbstractEventLoop
import argparse
import signal
import sys
from types import FrameType
from typing import Any
from dotenv import load_dotenv
import openai
import os
from aiconfig import AIConfigRuntime
from aiconfig.model_parser import InferenceOptions
from aiconfig.schema import ExecuteResult, Prompt

from prompt_toolkit import PromptSession


def deprefix(s: str, pfx: str) -> str:
    if s.startswith(pfx):  # Checks if the string starts with the given prefix
        return s[len(pfx) :]  # If true, returns the string without the prefix
    else:
        return s


class InterruptException(Exception):
    pass


state = {"interrupt": False}


async def run_query(aiconfig_path: str, question: str) -> int:
    answer = await query(aiconfig_path=aiconfig_path, question=question)
    print(answer)
    return 0


async def query(aiconfig_path: str, question: str) -> list[ExecuteResult]:
    runtime = AIConfigRuntime.load(aiconfig_path)

    inference_options = InferenceOptions(stream=True)

    params = {
        "the_input": question,
    }

    result = await runtime.run("query", params, inference_options)
    print(f"result:\n{result}")
    return result


async def get_mod_result(
    aiconfig_path: str, source_code: str, question: str
) -> list[ExecuteResult]:
    question_about_code = (
        f"QUERY ABOUT SOURCE CODE:\n{question}\nSOURCE CODE:\n```{source_code}\n```"
    )

    return await query(aiconfig_path, question_about_code)


async def mod_code(
    aiconfig_path: str, source_code_file: str, question: str, update_file: bool = False
):
    # read source code from file
    with open(source_code_file, "r", encoding="utf8") as file:
        source_code = file.read()

        answer = await get_mod_result(aiconfig_path, source_code, question)
        # TODO
        s_answer = str(answer)

        if update_file:
            # Here you would add your logic related to how the original code needs to be modified based on the answer
            with open(source_code_file, "w", encoding="utf8") as file:
                file.write(s_answer)

    return 0


@dataclass
class Help:
    pass


@dataclass
class Run:
    user_input: str


class Reload:
    # TODO
    # if should_reload and source_code_file is not None:
    # user_input = deprefix(user_input.strip(), "reload")
    # with open(source_code_file.strip(), "r", encoding="utf8") as file:
    #     source_code = file.read()
    #     llm_input = f"QUERY ABOUT SOURCE CODE:\n{user_input}\nSOURCE CODE:\n```{source_code}\n```"
    pass


class Clear:
    pass


class Pass:
    pass


class MultilineToggle:
    pass


Command = Pass | Help | Run | Reload | Clear | MultilineToggle


def _get_command(user_input: str) -> Command:
    normed = user_input.strip().lower()
    if normed in ["h", "help", "?"]:
        return Help()
    elif normed in ["r", "reload"]:
        return Reload()
    elif normed in ["c", "clear"]:
        return Clear()
    elif normed in ["m", "multiline"]:
        return MultilineToggle()
    else:
        return Run(user_input=user_input)


def _print_help():
    print(
        dedent(
            """
        Exit loop: Ctrl-D
        Toggle multiline input mode: m or multiline
        Clear screen: c or clear
        Reload source code: r or reload
            """
        )
    )


async def _run_llm(
    runtime: AIConfigRuntime, llm_input: str
) -> Result[ExecuteResult, str]:
    # Dynamically generate the prompt name and prompt object
    new_prompt_name = f"prompt{len(runtime.prompts)+1}"  # Prompt{number of prompts}
    new_prompt = Prompt(name=new_prompt_name, input=llm_input)

    # Add the new prompt and run the model
    runtime.add_prompt(new_prompt.name, new_prompt)

    def callback(delta: Any, _: Any, __: int):
        if state["interrupt"]:
            raise InterruptException()

        print(delta.get("content", ""), end="", flush=True)

    options = InferenceOptions(stream=True, stream_callback=callback)
    state["interrupt"] = False
    try:
        result = await runtime.run(new_prompt_name, {}, options=options)
        print(flush=True)
        return Ok(result)
    except InterruptException:
        return Err("interrupted")


async def _get_raw_input(
    event_loop: AbstractEventLoop, session: PromptSession[str], is_multiline: bool
) -> str:
    def _prompt():  # type: ignore
        return session.prompt(
            "> ",
            multiline=is_multiline,
        )

    return await event_loop.run_in_executor(None, _prompt)


async def loop(aiconfig_path: str, source_code_file: str | None):
    runtime = AIConfigRuntime.load(aiconfig_path)
    event_loop = asyncio.get_event_loop()
    session = PromptSession()
    state["interrupt"] = False

    def signal_handler(_: int, __: FrameType | None):
        state["interrupt"] = True
        print("\nStopping", flush=True)

    signal.signal(signal.SIGINT, signal_handler)

    is_multiline = False
    print("Enter 'h', 'help', or '?' for help.", flush=True)
    while True:
        try:
            raw_input = await _get_raw_input(event_loop, session, is_multiline)
        except KeyboardInterrupt:
            continue
        except EOFError:
            print("Exiting")
            break

        command = _get_command(raw_input)

        match command:
            case Pass():
                pass
            case Help():
                _print_help()
            case MultilineToggle():
                is_multiline = not is_multiline
                print(f"Multiline input mode: {'on' if is_multiline else 'off'}")
                if is_multiline:
                    print("Hit option-enter to submit.")
            case Run(user_input=user_input):
                prompt = f"""
                    INSTRUCTIONS: respond to the following query as concisely as possible.
                    Do not output more tokens than necessary.
                    QUERY: {user_input}
                    """
                llm_res = await _run_llm(runtime, prompt)
                match llm_res:
                    case Ok(_):
                        # TODO somethign with res?
                        pass
                    case Err(msg):
                        print(msg)
            case Reload():
                # TODO
                pass
            case Clear():
                print("\033c", end="")


async def main():
    parser = argparse.ArgumentParser()

    parser.add_argument("-c", "--aiconfig-path", required=True)

    subparsers = parser.add_subparsers(dest="command")

    loop_parser = subparsers.add_parser("loop")
    loop_parser.add_argument(
        "-scf", "--source-code-file", help="Specify a source code file."
    )

    args = parser.parse_args()

    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")

    if args.command == "loop":
        return await loop(args.aiconfig_path, args.source_code_file)


if __name__ == "__main__":
    res = asyncio.run(main())
    sys.exit(res)
