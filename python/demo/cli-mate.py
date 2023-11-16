import asyncio
import argparse
import signal
import sys
from dotenv import load_dotenv
import openai
import os
from aiconfig import AIConfigRuntime
from aiconfig.model_parser import InferenceOptions
from aiconfig.schema import Prompt

from prompt_toolkit import PromptSession


async def run_query(question: str) -> int:
    answer = await query(question)
    print(answer)
    return 0


async def query(question: str):
    config_file_path = "cli-mate.aiconfig.json"
    runtime = AIConfigRuntime.load(config_file_path)
    resolved = await runtime.resolve("question", {"prompt": question})
    # print(f"resolved:\n{resolved}")

    inference_options = InferenceOptions(stream=True)

    params = {
        "prompt": question,
    }

    result = await runtime.run("question", params, inference_options)
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


async def mod_loop(source_code_file: str):
    config_file_path = "cli-mate.aiconfig.json"
    runtime = AIConfigRuntime.load(config_file_path)

    current_task = asyncio.current_task()

    def handler():
        # print(f"{signum} received")
        print(f"SIGINT received {current_task}")
        if current_task:
            current_task.cancel()

    loop = asyncio.get_event_loop()
    loop.add_signal_handler(signal.SIGINT, handler)

    session = PromptSession()

    i = 0
    while True:
        try:
            # user_input = input("\nQuery: ")
            user_input = await loop.run_in_executor(None, session.prompt, "Query: ")
            if user_input.strip() == "":
                continue
            if user_input.strip().startswith("reload") or i == 0:
                user_input = deprefix(user_input.strip(), "reload")
                source_code = open(source_code_file, "r").read()
                prompt = (
                    f"QUERY ABOUT SOURCE CODE:\n{user_input}\nSOURCE CODE:\n```{source_code}\n```"
                )
            else:
                prompt = user_input
            # Dynamically generate the prompt name and prompt object
            new_prompt_name = f"prompt{len(runtime.prompts)+1}"  # Prompt{number of prompts}
            new_prompt = Prompt(name=new_prompt_name, input=prompt)

            # Add the new prompt and run the model
            runtime.add_prompt(new_prompt.name, new_prompt)
            inference_options = InferenceOptions(stream=True)
            # Now we assign an asyncio Task to current_task, instead of calling await directly

            current_task = asyncio.create_task(
                runtime.run(new_prompt_name, options=inference_options)
            )

            result = await current_task

            i += 1
        except asyncio.CancelledError:
            pass  # This is expected when SIGINT received, just pass


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

    mod_loop_parser = subparsers.add_parser("mod_loop")
    mod_loop_parser.add_argument("-scf", "--source-code-file", help="Specify a source code file.")

    args = parser.parse_args()

    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")

    if args.command == "query":
        return await run_query(args.question)
    elif args.command == "mod":
        return await mod_code(args.source_code_file, args.question, args.i)
    elif args.command == "mod_loop":
        return await mod_loop(args.source_code_file)


if __name__ == "__main__":
    res = asyncio.run(main())
    sys.exit(res)
