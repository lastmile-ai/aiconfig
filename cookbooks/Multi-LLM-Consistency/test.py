import asyncio
from aiconfig import *


async def main():
    config = AIConfigRuntime.load(
        "Multi-LLM Consistency Prompting & LLM-based Quorum_aiconfig.json"
    )

    p = await config.serialize("models/text-bison-001", {"prompt": "hello"}, "prompt_2", )
    print(p)

    config.add_prompt(p[0].name, p[0])
    r = await config.run("prompt_2")
    print(config.get_output_text("prompt_2"))

asyncio.run(main())
