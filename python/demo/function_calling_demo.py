import copy
import json
import uuid
from aiconfig import AIConfigRuntime
from aiconfig import Prompt
from aiconfig import PromptInput
from aiconfig.model_parser import InferenceOptions
from pprint import pprint


async def function_calling():
    config_file_path = "function-call.aiconfig.json"
    config = AIConfigRuntime.load(config_file_path)

    params = {
        "book": "Where the Crawdads Sing",
    }

    completionParams = await config.resolve("recommendBook", params)

    print("completionParams=", end=" ")
    pprint(completionParams)

    messages = completionParams["messages"]
    print(messages[0])
    print(messages[1])
    print()

    promptToRun = "recommendBook"

    inference_options = InferenceOptions(stream=True)

    while True:
        model_output = await config.run(promptToRun, params, inference_options)

        output = model_output[0] if isinstance(model_output, list) else model_output

        if output.output_type == "error":
            print(f"Error during inference: {output.ename}: {output.evalue}")
            return

        message = output.data

        # If there is no function call, we're done and can exit this loop
        if not message.get("function_call", None):
            return

        # If there is a function call, we generate a new message with the role 'function'.

        result = await callFunction(message.get("function_call"))

        new_message = {
            "role": "function",
            "name": message["function_call"]["name"],
            "content": json.dumps(result),
        }

        promptToRun = f"functionCallResult-{uuid.uuid4()}"

        existing_prompt = config.get_prompt("recommendBook")

        new_prompt = copy.deepcopy(existing_prompt)
        new_prompt.name = promptToRun
        new_prompt.input = PromptInput(**new_message)
        new_prompt.outputs = []

        config.add_prompt(new_prompt.name, new_prompt)

        print(f"{new_message}\n")


db = [
    {
        "id": "a1",
        "name": "To Kill a Mockingbird",
        "genre": "historical",
        "description": 'Compassionate, dramatic, and deeply moving, "To Kill A Mockingbird" takes readers to the roots of human behavior - to innocence and experience, kindness and cruelty, love and hatred, humor and pathos. Now with over 18 million copies in print and translated into forty languages, this regional story by a young Alabama woman claims universal appeal. Harper Lee always considered her book to be a simple love story. Today it is regarded as a masterpiece of American literature.',
    },
    {
        "id": "a2",
        "name": "All the Light We Cannot See",
        "genre": "historical",
        "description": "In a mining town in Germany, Werner Pfennig, an orphan, grows up with his younger sister, enchanted by a crude radio they find that brings them news and stories from places they have never seen or imagined. Werner becomes an expert at building and fixing these crucial new instruments and is enlisted to use his talent to track down the resistance. Deftly interweaving the lives of Marie-Laure and Werner, Doerr illuminates the ways, against all odds, people try to be good to one another.",
    },
    {
        "id": "a3",
        "name": "Where the Crawdads Sing",
        "genre": "historical",
        "description": """For years, rumors of the “Marsh Girl” haunted Barkley Cove, a quiet fishing village. Kya Clark is barefoot and wild; unfit for polite society. So in late 1969, when the popular Chase Andrews is found dead, locals immediately suspect her.

But Kya is not what they say. A born naturalist with just one day of school, she takes life's lessons from the land, learning the real ways of the world from the dishonest signals of fireflies. But while she has the skills to live in solitude forever, the time comes when she yearns to be touched and loved. Drawn to two young men from town, who are each intrigued by her wild beauty, Kya opens herself to a new and startling world—until the unthinkable happens.""",
    },
]


async def list_items(genre: str):
    # filter
    items = [item for item in db if item["genre"] == genre]
    # map
    return [{"name": item["name"], "id": item["id"]} for item in items]


async def search(name: str):
    # filter
    items = [item for item in db if name in item["name"]]
    # map
    return [{"name": item["name"], "id": item["id"]} for item in items]


async def get(id: str):
    return [item for item in db if item["id"] == id][0] or None


async def callFunction(function_call):
    args = function_call.get("arguments", None)
    args = json.loads(args) if args else None

    if not args:
        raise Exception("No arguments found")

    match function_call.get("name"):
        case "list":
            return await list_items(args["genre"])
        case "search":
            return await search(args["name"])
        case "get":
            return await get(args["id"])


import asyncio

asyncio.run(function_calling())
