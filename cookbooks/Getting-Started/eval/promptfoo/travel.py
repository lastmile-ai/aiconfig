import asyncio
import os

import openai
from dotenv import load_dotenv

from aiconfig import AIConfigRuntime
from aiconfig.model_parser import InferenceOptions
import sys


async def main():
    question = sys.argv[1]
    aiconfig_path = "../../travel.aiconfig.json"

    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")
    runtime = AIConfigRuntime.load(aiconfig_path)

    params = {
        "the_query": question,
    }

    result = await runtime.run("get_activities_parametrized", params)
    final_output = runtime.get_output_text("get_activities", result[0])
    print(final_output)


if __name__ == "__main__":
    asyncio.run(main())
