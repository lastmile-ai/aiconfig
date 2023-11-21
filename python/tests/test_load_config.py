# import ai_config_tools Config class

import os
from aiconfig import AIConfigRuntime
from mock import patch
import openai
import pytest

from .util.file_path_utils import get_absolute_file_path_from_relative
from .conftest import set_temporary_env_vars
import os
import pytest


@pytest.mark.asyncio
async def test_load_basic_chatgpt_query_config(set_temporary_env_vars):
    """Test loading a basic chatgpt query config"""
    config_relative_path = "aiconfigs/basic_chatgpt_query_config.json"
    config_absolute_path = get_absolute_file_path_from_relative(__file__, config_relative_path)
    config = AIConfigRuntime.load(config_absolute_path)

    data_for_inference = await config.resolve("prompt1")

    assert data_for_inference == {
        "model": "gpt-3.5-turbo",
        "top_p": 1,
        "temperature": 1,
        "stream": False,
        "messages": [{"content": "Hi! Tell me 10 cool things to do in NYC.", "role": "user"}],
    }

@pytest.mark.asyncio
async def test_load_basic_dalle2_config(set_temporary_env_vars):
    """Test loading a basic Dall-E 2 config"""
    config_relative_path = "aiconfigs/basic_dalle2_config.json"
    config_absolute_path = get_absolute_file_path_from_relative(__file__, config_relative_path)
    config = AIConfigRuntime.load(config_absolute_path)

    data_for_inference = await config.resolve("panda_eating_dumplings")

    assert data_for_inference == {
        "model": "dall-e-2",
        'n': 4,
        'prompt': 'Panda eating dumplings on a yellow mountain',
        'size': '1024x1024'
    }

@pytest.mark.asyncio
async def test_load_basic_dalle3_config(set_temporary_env_vars):
    """Test loading a basic Dall-E 3 config"""
    config_relative_path = "aiconfigs/basic_dalle3_config.json"
    config_absolute_path = get_absolute_file_path_from_relative(__file__, config_relative_path)
    config = AIConfigRuntime.load(config_absolute_path)

    data_for_inference = await config.resolve("panda_eating_dumplings")

    assert data_for_inference == {
        "model": "dall-e-3",
        'n': 1,
        'prompt': 'Panda eating dumplings on a yellow mountain',
        'size': '1024x1024'
    }


@pytest.mark.asyncio
async def test_chained_gpt_config(set_temporary_env_vars):
    """Test loading a chained gpt config and resolving it, with chat context enabled"""
    config_relative_path = "aiconfigs/chained_gpt_config.json"
    config_absolute_path = get_absolute_file_path_from_relative(__file__, config_relative_path)
    config = AIConfigRuntime.load(config_absolute_path)

    data_for_inference1 = await config.resolve("prompt1")

    assert data_for_inference1 == {
        "model": "gpt-3.5-turbo",
        "top_p": 1,
        "max_tokens": 3000,
        "temperature": 1,
        "messages": [
            {
                "content": "I need to create a JSON representation of a list of products for our e-commerce website. Please provide the JSON structure with placeholders for product details.",
                "role": "user",
            }
        ],
    }

    data_for_inference2 = await config.resolve("prompt2")

    # this config has remember_chat_context enabled
    assert data_for_inference2 == {
        "model": "gpt-3.5-turbo",
        "top_p": 1,
        "max_tokens": 3000,
        "temperature": 1,
        "messages": [
            {
                "content": "I need to create a JSON representation of a list of products for our e-commerce website. Please provide the JSON structure with placeholders for product details.",
                "role": "user",
            },
            {
                "content": "Now, fill in the placeholders with the details of three products, including their names, prices, and descriptions.",
                "role": "user",
            },
        ],
    }


@pytest.mark.asyncio
async def test_resolve_system_prompt():
    """
    Resolves a system prompt with a provided parameter
    """
    config_relative_path = "aiconfigs/system_prompt_parameters_config.json"
    config_absolute_path = get_absolute_file_path_from_relative(__file__, config_relative_path)
    config = AIConfigRuntime.load(config_absolute_path)

    data_for_inference = await config.resolve("prompt1", {"system": "skip odd numbers"})
    assert data_for_inference == {
        "temperature": 1,
        "model": "gpt-3.5-turbo",
        "top_p": 1,
        "messages": [
            {"content": "skip odd numbers", "role": "system"},
            {"content": "Hi! Please Count to 10", "role": "user"},
        ],
    }
