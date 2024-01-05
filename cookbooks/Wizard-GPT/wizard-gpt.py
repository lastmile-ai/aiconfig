import asyncio
import os

import dotenv

# Create ~/.env file with this line: export OPENAI_API_KEY=<your key here>
# You can get your key from https://platform.openai.com/api-keys
import openai

from aiconfig import AIConfigRuntime, InferenceOptions, Prompt

dotenv.load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")


async def main():
    while True:
        user_input = input("\nUser: ")
        if user_input == "quit":
            break

        # Dynamically generate the prompt name and prompt object
        new_prompt_name = f"prompt{len(config.prompts)+1}"  # Prompt{number of prompts}
        new_prompt = Prompt(name=new_prompt_name, input=user_input)

        # Add the new prompt and run the model
        config.add_prompt(new_prompt.name, new_prompt)
        await config.run(new_prompt_name, options=inference_options)

        # Persist the conversation into the aiconfig file
        config.save()


if __name__ == "__main__":
    inference_options = InferenceOptions()
    config = AIConfigRuntime.load("wizard.aiconfig.json")
    asyncio.run(main())
