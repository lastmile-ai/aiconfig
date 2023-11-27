import warnings

warnings.filterwarnings("ignore")

import argparse
import asyncio
import os
import signal
import sys
from types import FrameType
from typing import Any

import openai
from aiconfig.model_parser import InferenceOptions
from dotenv import load_dotenv
from prompt_toolkit import PromptSession

from aiconfig import AIConfigRuntime
from aiconfig.schema import ExecuteResult, Prompt


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


async def loop(aiconfig_path: str, source_code_file: str | None):
    runtime = AIConfigRuntime.load(aiconfig_path)
    event_loop = asyncio.get_event_loop()

    session = PromptSession()

    state["interrupt"] = False

    def signal_handler(_: int, __: FrameType | None):
        state["interrupt"] = True
        print("\nStopping", flush=True)

    signal.signal(signal.SIGINT, signal_handler)

    i = 0
    while True:
        try:
            user_input = await event_loop.run_in_executor(
                None, session.prompt, "Query: [ctrl-D to exit] "
            )
        except KeyboardInterrupt:
            continue
        except EOFError:
            print("Exiting")
            break

        if user_input.strip() == "":
            continue

        should_reload = user_input.strip().startswith("reload") or i == 0
        if should_reload and source_code_file is not None:
            user_input = deprefix(user_input.strip(), "reload")
            with open(source_code_file.strip(), "r", encoding="utf8") as file:
                source_code = file.read()
                prompt = f"QUERY ABOUT SOURCE CODE:\n{user_input}\nSOURCE CODE:\n```{source_code}\n```"
        else:
            prompt = user_input

        # Dynamically generate the prompt name and prompt object
        new_prompt_name = f"prompt{len(runtime.prompts)+1}"  # Prompt{number of prompts}
        new_prompt = Prompt(name=new_prompt_name, input=prompt)

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
            # print(f"{result=}")
            print(flush=True)
            i += 1
        except InterruptException:
            continue


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
