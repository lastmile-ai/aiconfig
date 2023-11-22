import argparse
import asyncio
import os

import openai
from dotenv import load_dotenv

from aiconfig import AIConfigRuntime
from aiconfig.model_parser import InferenceOptions
import sys


async def main():
    aiconfig_path = "cookbooks/Getting-Started/travel.aiconfig.json"
    question = sys.argv[1]

    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")
    runtime = AIConfigRuntime.load(aiconfig_path)
    inference_options = InferenceOptions(stream=False)

    params = {
        "the_query": question,
    }

    _ = await runtime.run("get_activities", params, inference_options)
    final_output = runtime.get_output_text("get_activities")
    # print(final_output)


if __name__ == "__main__":
    asyncio.run(main())
