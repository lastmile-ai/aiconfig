import asyncio
import json
import os
import sys
from typing import Any

import openai
from dotenv import load_dotenv

from aiconfig.eval.lib import run_aiconfig_helper


async def main():
    settings_path = sys.argv[1]
    settings = _load_settings(settings_path)

    question = sys.argv[2]
    prompt_name = settings["prompt_name"]
    aiconfig_path = settings["aiconfig_path"]

    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")
    output = await run_aiconfig_helper(aiconfig_path, prompt_name, question)
    print(output)


def _load_settings(settings_path: str) -> dict[str, Any]:
    with open(settings_path) as f:
        settings = json.load(f)
        return settings


if __name__ == "__main__":
    asyncio.run(main())
