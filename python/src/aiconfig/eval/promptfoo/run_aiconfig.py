import asyncio
import os

import openai
from dotenv import load_dotenv

from aiconfig import AIConfigRuntime
import sys
import json
from typing import Any


async def main():
    settings_path = sys.argv[1]
    settings = _load_settings(settings_path)

    question = sys.argv[2]
    prompt_name = settings["prompt_name"]
    aiconfig_path = settings["aiconfig_path"]

    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")
    runtime = AIConfigRuntime.load(aiconfig_path)

    params = {
        "the_query": question,
    }

    result = await runtime.run(prompt_name, params)
    final_output = runtime.get_output_text(prompt_name, result[0])
    print(final_output)


def _load_settings(settings_path: str) -> dict[str, Any]:
    with open(settings_path) as f:
        settings = json.load(f)
        return settings


if __name__ == "__main__":
    asyncio.run(main())
