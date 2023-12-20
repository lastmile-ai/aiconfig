import google.generativeai as genai


# for model in genai.list_models():
#     print(model)
model = genai.GenerativeModel("gemini-pro")


import time
import asyncio


async def main():
    response = await model.generate_content_async(contents={"role": "user", "parts": "What's your favorite condiment"})

    {"contents": }

    print(response.__dict__)


asyncio.run((main()))
