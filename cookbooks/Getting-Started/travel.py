import argparse
import asyncio
import os

import openai
from dotenv import load_dotenv

from aiconfig import AIConfigRuntime
from aiconfig.model_parser import InferenceOptions


async def main():
    parser = argparse.ArgumentParser()

    parser.add_argument("question")
    parser.add_argument("-c", "--aiconfig-path", required=True)

    args = parser.parse_args()

    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")
    runtime = AIConfigRuntime.load(args.aiconfig_path)
    inference_options = InferenceOptions(stream=True)

    params = {
        "input": args.question,
    }

    result = await runtime.run("get_activities", params, inference_options)
    print(f"{result=}")


if __name__ == "__main__":
    asyncio.run(main())
