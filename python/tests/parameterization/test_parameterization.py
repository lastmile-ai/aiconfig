"""
Test suite to test Parameterization in AIConfig

Precendence is as follows: User Defined > Prompt > Global
1. Global Params only.
2. Prompt Params only
3. User defined params only
4. Prompt Params and User defined params
5. Global Params and User defined params
6. Global Params and Prompt Params
7. Global Params, Prompt Params, and User defined params
8. No params
"""

from aiconfig import AIConfigRuntime
import pytest

config1 = {
    "name": "test config",
    "description": "",
    "schema_version": "latest",
    "metadata": {
        "parameters": {"name": "John WorldWide"},
    },
    "prompts": [
        {
            "name": "prompt1",
            "input": "Hello, {{name}}",
            "metadata": {
                "model": {
                    "name": "gpt-3.5-turbo",
                    "settings": {"model": "gpt-3.5-turbo", "top_p": 1, "temperature": 1},
                },
            },
        }
    ],
}

# mark tests with async to use async fixtures

@pytest.mark.asyncio
async def test_global_params_only():
    config = config1
    ai_config = AIConfigRuntime(**config)
    resolved_params = await ai_config.resolve("prompt1", {})

    prompt_from_resolved_params = resolved_params["messages"][0]["content"]
    assert prompt_from_resolved_params == "Hello, John WorldWide"
    
config2 = {
    "name": "test config",
    "description": "",
    "schema_version": "latest",
    "metadata": {
        "parameters": {},
    },
    "prompts": [
        {
            "name": "prompt1",
            "input": "Hello, {{name}}",
            "metadata": {
                "model": {
                    "name": "gpt-3.5-turbo",
                    "settings": {"model": "gpt-3.5-turbo", "top_p": 1, "temperature": 1},
                },
                "parameters": {"name": "John Local"},
            },
        }
    ],
}
@pytest.mark.asyncio
async def test_local_params_only():
    config = config2
    ai_config = AIConfigRuntime(**config)
    resolved_params = await ai_config.resolve("prompt1", {})
    
    prompt_from_resolved_params = resolved_params["messages"][0]["content"]
    assert prompt_from_resolved_params == "Hello, John Local"

config3 = {
    "name": "test config",
    "description": "",
    "schema_version": "latest",
    "metadata": {
        "parameters": {},
    },
    "prompts": [
        {
            "name": "prompt1",
            "input": "Hello, {{name}}",
            "metadata": {
                "model": {
                    "name": "gpt-3.5-turbo",
                    "settings": {"model": "gpt-3.5-turbo", "top_p": 1, "temperature": 1},
                },
                "parameters": {},
            },
        }
    ],
}
@pytest.mark.asyncio
async def test_local_params_only():
    config = config3
    ai_config = AIConfigRuntime(**config)
    params = {"name": "John User"}
    resolved_params = await ai_config.resolve("prompt1", params)
    
    prompt_from_resolved_params = resolved_params["messages"][0]["content"]
    assert prompt_from_resolved_params == "Hello, John User"


config4 = {
    "name": "test config",
    "description": "",
    "schema_version": "latest",
    "metadata": {
        "parameters": {},
    },
    "prompts": [
        {
            "name": "prompt1",
            "input": "Hello, {{name}}",
            "metadata": {
                "model": {
                    "name": "gpt-3.5-turbo",
                    "settings": {"model": "gpt-3.5-turbo", "top_p": 1, "temperature": 1},
                },
                "parameters": {"name": "John Local"},
            },
        }
    ],
}
@pytest.mark.asyncio
async def test_local_params_and_user_defined_params():
    config = config4
    ai_config = AIConfigRuntime(**config)
    params = {"name": "John User"}
    resolved_params = await ai_config.resolve("prompt1", params)
    
    prompt_from_resolved_params = resolved_params["messages"][0]["content"]
    assert prompt_from_resolved_params == "Hello, John User"

config5 = {
    "name": "test config",
    "description": "",
    "schema_version": "latest",
    "metadata": {
        "parameters": {"name": "John Global"},
    },
    "prompts": [
        {
            "name": "prompt1",
            "input": "Hello, {{name}}",
            "metadata": {
                "model": {
                    "name": "gpt-3.5-turbo",
                    "settings": {"model": "gpt-3.5-turbo", "top_p": 1, "temperature": 1},
                },
                "parameters": {},
            },
        }
    ],
}
@pytest.mark.asyncio
async def test_global_params_and_user_defined_params():
    config = config5
    ai_config = AIConfigRuntime(**config)
    params = {"name": "John User"}
    resolved_params = await ai_config.resolve("prompt1", params)
    
    prompt_from_resolved_params = resolved_params["messages"][0]["content"]
    assert prompt_from_resolved_params == "Hello, John User"

config6 = {
    "name": "test config",
    "description": "",
    "schema_version": "latest",
    "metadata": {
        "parameters": {"name": "John Global"},
    },
    "prompts": [
        {
            "name": "prompt1",
            "input": "Hello, {{name}}",
            "metadata": {
                "model": {
                    "name": "gpt-3.5-turbo",
                    "settings": {"model": "gpt-3.5-turbo", "top_p": 1, "temperature": 1},
                },
                "parameters": {"name": "John Local"},
            },
        }
    ],
}

@pytest.mark.asyncio
async def test_global_params_and_local_params():
    config = config6
    ai_config = AIConfigRuntime(**config)
    resolved_params = await ai_config.resolve("prompt1", {})
    
    prompt_from_resolved_params = resolved_params["messages"][0]["content"]
    assert prompt_from_resolved_params == "Hello, John Local"

config7 = {
    "name": "test config",
    "description": "",
    "schema_version": "latest",
    "metadata": {
        "parameters": {"name": "John Global"},
    },
    "prompts": [
        {
            "name": "prompt1",
            "input": "Hello, {{name}}",
            "metadata": {
                "model": {
                    "name": "gpt-3.5-turbo",
                    "settings": {"model": "gpt-3.5-turbo", "top_p": 1, "temperature": 1},
                },
                "parameters": {"name": "John Local"},
            },
        }
    ],
}

@pytest.mark.asyncio
async def test_global_params_and_local_params():
    config = config7
    ai_config = AIConfigRuntime(**config)
    params = {"name": "John User"}
    resolved_params = await ai_config.resolve("prompt1", params)
    
    prompt_from_resolved_params = resolved_params["messages"][0]["content"]
    assert prompt_from_resolved_params == "Hello, John User"

config8 = {
    "name": "test config",
    "description": "",
    "schema_version": "latest",
    "metadata": {
        "parameters": {},
    },
    "prompts": [
        {
            "name": "prompt1",
            "input": "Hello, {{name}}",
            "metadata": {
                "model": {
                    "name": "gpt-3.5-turbo",
                    "settings": {"model": "gpt-3.5-turbo", "top_p": 1, "temperature": 1},
                },
                "parameters": {},
            },
        }
    ],
}

@pytest.mark.asyncio
async def test_no_params():
    config = config8
    ai_config = AIConfigRuntime(**config)
    resolved_params = await ai_config.resolve("prompt1", {})
    
    prompt_from_resolved_params = resolved_params["messages"][0]["content"]
    assert prompt_from_resolved_params == "Hello, "