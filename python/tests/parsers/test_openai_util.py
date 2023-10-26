from aiconfig import Prompt
from aiconfig import PromptMetadata, ExecuteResult
from aiconfig.Config import AIConfigRuntime
from aiconfig import Prompt
from aiconfig.default_parsers.openai import add_prompt_as_message, refine_chat_completion_params
from mock import patch
import openai
import pytest

from ..conftest import mock_openai_chat_completion


def test_refine_chat_completion_params():
    model_settings_with_stream_and_system_prompt = {
        "n": "3",
        "stream": True,
        "system_prompt": "system_prompt",
        "random_attribute": "value_doesn't_matter",
    }
    refined_params = refine_chat_completion_params(model_settings_with_stream_and_system_prompt)

    assert "system_prompt" not in refined_params
    assert "stream" not in refined_params
    assert "random_attribute" not in refined_params
    assert refined_params["n"] == "3"


@pytest.mark.asyncio
@patch.object(openai.ChatCompletion, "create", side_effect=mock_openai_chat_completion)
async def test_get_output_text(mock_method):
    aiconfig = AIConfigRuntime.from_config("../tests/aiconfigs/basic_chatgpt_query_config.json")
    await aiconfig.run("prompt1", {})

    output = aiconfig.get_output_text("prompt1")
    # Mock outputs stored in conftest
    assert (
        output
        == "1. Visit Times Square: Experience the bright lights and bustling atmosphere of this iconic NYC landmark. Enjoy shopping, dining, and various entertainment options.\n\n2. Explore Central Park: Take a leisurely stroll or rent a bike to explore the beautiful landscapes, visit the Central Park Zoo, have a picnic, or even go horseback riding.\n\n3. Walk the High Line: This elevated park built on a historic freight rail line offers stunning views of the city skyline, beautiful gardens, art installations, and a unique perspective of NYC.\n\n4. Take a ferry to the Statue of Liberty: Visit the iconic Statue of Liberty on Liberty Island and enjoy breathtaking views of the city from the Crown or the pedestal. You can also explore Ellis Island's immigration museum nearby.\n\n5. Visit the Metropolitan Museum of Art: Explore the vast collections of art and artifacts from around the world at the Met and immerse yourself in the rich cultural history.\n\n6. Discover the vibrant neighborhoods: Explore the diverse neighborhoods of NYC, such as Chinatown, Little Italy, Greenwich Village, and Williamsburg. Enjoy authentic cuisine, unique shops, and immerse yourself in different cultures.\n\n7. Catch a Broadway show: Experience the magic of Broadway by watching a world-class performance at one of the many theaters in the Theater District.\n\n8. Walk across the Brooklyn Bridge: Enjoy panoramic views of the city as you walk or bike across the iconic Brooklyn Bridge, connecting Manhattan and Brooklyn.\n\n9. Explore the Museum of Modern Art (MoMA): Discover modern and contemporary art at MoMA, featuring masterpieces by artists like Van Gogh, Picasso, Warhol, and many more.\n\n10. Enjoy the food scene: NYC is a food lover's paradise. Indulge in diverse culinary experiences, from street food to Michelin-starred restaurants. Don't forget to try New York-style pizza, bagels, and the famous cronut."
    )


@pytest.mark.asyncio
@patch.object(openai.ChatCompletion, "create", side_effect=mock_openai_chat_completion)
async def test_serialize(mock_method):
    # Test with one input prompt and system. No output
    completion_params = {
        "model": "gpt-3.5-turbo",
        "temperature": 0.7,
        "max_tokens": 900,
        "messages": [
            {"role": "system", "content": "You are an expert greeter"},
            {"role": "user", "content": "Hello!"},
        ],
    }

    aiconfig = AIConfigRuntime.create()
    serialized_prompts = await aiconfig.serialize("gpt-3.5-turbo", completion_params)
    new_prompt = serialized_prompts[0]

    # assert prompt serialized correctly into config
    assert new_prompt == Prompt(
        name="prompt_1",
        input="Hello!",
        metadata=PromptMetadata(
            **{
                "model": {
                    "name": "gpt-3.5-turbo",
                    "settings": {
                        "model": "gpt-3.5-turbo",
                        "temperature": 0.7,
                        "max_tokens": 900,
                        "system_prompt": "You are an expert greeter",
                    },
                },
                "remember_chat_context": True,
            }
        ),
    )

    # Test with Completion params with an output
    completion_params = {
        "model": "gpt-3.5-turbo",
        "temperature": 0.7,
        "max_tokens": 900,
        "messages": [
            {"role": "system", "content": "You are an expert greeter"},
            {"role": "user", "content": "Hello!"},
            {"role": "assistant", "content": "Hello! How can I assist you today?"},
        ],
    }

    serialized_prompts = await aiconfig.serialize("gpt-3.5-turbo", completion_params)
    new_prompt = serialized_prompts[0]

    assert new_prompt == Prompt(
        name="prompt_1",
        input="Hello!",
        metadata=PromptMetadata(
            **{
                "model": {
                    "name": "gpt-3.5-turbo",
                    "settings": {
                        "model": "gpt-3.5-turbo",
                        "temperature": 0.7,
                        "max_tokens": 900,
                        "system_prompt": "You are an expert greeter",
                    },
                },
                "remember_chat_context": True,
            }
        ),
        outputs=[
            ExecuteResult(
                output_type="execute_result",
                execution_count=None,
                data={"role": "assistant", "content": "Hello! How can I assist you today?"},
                metadata={},
            )
        ],
    )

    # Test completion params with a function call input

    completion_params = {
        "model": "gpt-3.5-turbo",
        "temperature": 0.7,
        "max_tokens": 900,
        "messages": [
            {"role": "system", "content": "You are an expert decision maker"},
            {"role": "user", "content": "What is the weather today?"},
        ],
        "functions": [
            {
                "name": "get_current_weather",
                "description": "Get the current weather in a given location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "The city and state, e.g. San Francisco, CA",
                        },
                        "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                    },
                    "required": ["location"],
                },
            }
        ],
    }

    serialized_prompts = await aiconfig.serialize("gpt-3.5-turbo", completion_params)
    new_prompt = serialized_prompts[0]
    assert new_prompt == Prompt(
        name="prompt_1",
        input="What is the weather today?",
        metadata=PromptMetadata(
            **{
                "model": {
                    "name": "gpt-3.5-turbo",
                    "settings": {
                        "model": "gpt-3.5-turbo",
                        "temperature": 0.7,
                        "max_tokens": 900,
                        "system_prompt": "You are an expert decision maker",
                        "functions": [
                            {
                                "name": "get_current_weather",
                                "description": "Get the current weather in a given location",
                                "parameters": {
                                    "type": "object",
                                    "properties": {
                                        "location": {
                                            "type": "string",
                                            "description": "The city and state, e.g. San Francisco, CA",
                                        },
                                        "unit": {
                                            "type": "string",
                                            "enum": ["celsius", "fahrenheit"],
                                        },
                                    },
                                    "required": ["location"],
                                },
                            }
                        ],
                    },
                },
                "remember_chat_context": True,
            }
        ),
    )

    completion_params = {
        "model": "gpt-3.5-turbo",
        "temperature": 0.7,
        "max_tokens": 900,
        "messages": [
            {"role": "system", "content": "You are an expert decision maker"},
            {"role": "user", "content": "What's the weather like in Boston today?"},
            {
                "role": "assistant",
                "content": None,
                "function_call": {
                    "name": "get_current_weather",
                    "arguments": '{ "location": "Boston, MA"}',
                },
            },
            {
                "role": "function",
                "name": "get_current_weather",
                "content": '{"temperature": "22", "unit": "celsius", "description": "Sunny"}',
            },
            {
                "role": "assistant",
                "content": "The current weather in Boston is 22 degrees Celsius and sunny.",
            },
        ],
        "functions": [
            {
                "name": "get_current_weather",
                "description": "Get the current weather in a given location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "The city and state, e.g. San Francisco, CA",
                        },
                        "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                    },
                    "required": ["location"],
                },
            }
        ],
    }

    prompts = await aiconfig.serialize("gpt-3.5-turbo", completion_params)
    new_prompt = prompts[1]
    assert new_prompt == Prompt(
        name="prompt_2",
        input={
            "content": '{"temperature": "22", "unit": "celsius", "description": "Sunny"}',
            "data": None,
            "name": "get_current_weather",
            "role": "function",
        },
        metadata={
            "model": {
                "name": "gpt-3.5-turbo",
                "settings": {
                    "functions": [
                        {
                            "description": "Get the current weather in a given location",
                            "name": "get_current_weather",
                            "parameters": {
                                "properties": {
                                    "location": {
                                        "description": "The city and state, e.g. San Francisco, CA",
                                        "type": "string",
                                    },
                                    "unit": {"enum": ["celsius", "fahrenheit"], "type": "string"},
                                },
                                "required": ["location"],
                                "type": "object",
                            },
                        }
                    ],
                    "max_tokens": 900,
                    "model": "gpt-3.5-turbo",
                    "system_prompt": "You are an expert decision maker",
                    "temperature": 0.7,
                },
            },
            "parameters": {},
            "remember_chat_context": True,
            "tags": None,
        },
        outputs=[
            {
                "data": {
                    "content": "The current weather in Boston is 22 degrees Celsius and sunny.",
                    "role": "assistant",
                },
                "execution_count": None,
                "metadata": {},
                "output_type": "execute_result",
            }
        ],
    )


