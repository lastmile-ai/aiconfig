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


async def main():
    question = "what is an electron?"
    aiconfig_path = (
        "/Users/jonathan/Projects/aiconfig/stanford_lastmile_workshop_aiconfig (3).json"
    )
    runtime = AIConfigRuntime.load(aiconfig_path)
    output = await runtime.run("router", params={"prompt": question})
    topic = runtime.get_output_text("router")
    print(f"{topic=}")
    answer = await runtime.run(topic)
    print(f"{answer=}")


if __name__ == "__main__":
    asyncio.run(main())
