import asyncio
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
from aiconfig.schema import Prompt

from prompt_toolkit import PromptSession


state = {"interrupt": False}


async def run_query(question: str) -> int:
    answer = await query(question)
    print(answer)
    return 0


async def query(question: str):
    config_file_path = "cli-mate.aiconfig.json"
    runtime = AIConfigRuntime.load(config_file_path)
    # resolved = await runtime.resolve("question", {"prompt": question})
    # print(f"resolved:\n{resolved}")

    inference_options = InferenceOptions(stream=True)

    params = {
        "the_input": question,
    }

    result = await runtime.run("query", params, inference_options)
    print(f"result:\n{result}")
    return result


async def get_mod_result(source_code: str, question: str):
    question_about_code = (
        f"QUERY ABOUT SOURCE CODE:\n{question}\nSOURCE CODE:\n```{source_code}\n```"
    )

    return await query(question_about_code)


async def mod_code(source_code_file: str, question: str, update_file: bool = False):
    # read source code from file
    with open(source_code_file, "r") as file:
        source_code = file.read()

        answer = await get_mod_result(source_code, question)
        s_answer = "the anser"

        if update_file:
            # Here you would add your logic related to how the original code needs to be modified based on the answer
            with open(source_code_file, "w") as file:
                file.write(s_answer)

    return 0


def deprefix(s: str, pfx: str) -> str:
    if s.startswith(pfx):  # Checks if the string starts with the given prefix
        return s[len(pfx) :]  # If true, returns the string without the prefix
    else:
        return s  # If false, returns the string as is


class InterruptException(Exception):
    pass


async def loop(source_code_file: str | None):
    config_file_path = "cli-mate.aiconfig.json"
    runtime = AIConfigRuntime.load(config_file_path)
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

        # user_input = input("Query: ")
        if user_input.strip() == "":
            continue

        should_reload = user_input.strip().startswith("reload") or i == 0
        if should_reload and source_code_file is not None:
            user_input = deprefix(user_input.strip(), "reload")
            source_code = open(source_code_file, "r").read()
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
            print(flush=True)
            i += 1
        except InterruptException:
            continue


async def main():
    parser = argparse.ArgumentParser()

    subparsers = parser.add_subparsers(dest="command")

    query_parser = subparsers.add_parser("query")
    query_parser.add_argument("question", help="Enter a question.")

    mod_parser = subparsers.add_parser("mod")
    mod_parser.add_argument("-scf", "--source-code-file", help="Specify a source code file.")
    mod_parser.add_argument(
        "-q", "--question", required=True, help="Enter a question about the code."
    )
    mod_parser.add_argument(
        "-i", action="store_true", help="Update provided source file in-place."
    )

    loop_parser = subparsers.add_parser("loop")
    loop_parser.add_argument("-scf", "--source-code-file", help="Specify a source code file.")

    args = parser.parse_args()

    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")

    if args.command == "query":
        return await run_query(args.question)
    elif args.command == "mod":
        return await mod_code(args.source_code_file, args.question, args.i)
    elif args.command == "loop":
        return await loop(args.source_code_file)


if __name__ == "__main__":
    event_loop = asyncio.get_event_loop()
    res = event_loop.run_until_complete(main())
    sys.exit(res)
