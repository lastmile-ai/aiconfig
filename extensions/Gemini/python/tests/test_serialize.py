import aiconfig_extension_gemini
import pytest
import google.generativeai as genai

from aiconfig import AIConfigRuntime, Prompt, PromptMetadata, ModelMetadata

aiconfig = AIConfigRuntime.load("gemini-pro.aiconfig.json")


@pytest.mark.asyncio
async def test_serialize():
    # """
    # Test the Serialize functionality of the gemini extension

    # Gemini api supports a whole host of inputs, however, we only support a subset of them. Specifically, types that contain strings (and not protos)
    # """

    # One Shot simple string
    gemini_args_dict = {"contents": "hello"}
    prompts = await aiconfig.serialize(model_name="gemini-pro", data=gemini_args_dict, prompt_name="prompt")
    assert prompts == [Prompt(name="prompt", input="hello", metadata=PromptMetadata(model=ModelMetadata(name="models/gemini-pro", settings={})))]  # type: ignore

    # One Shot Role Dictionary
    gemini_args_dict = {"contents": {"role": "user", "parts": "Hello"}}
    prompts = await aiconfig.serialize(model_name="gemini-pro", data=gemini_args_dict, prompt_name="prompt")
    assert prompts == [Prompt(name="prompt", input={"role": "user", "parts": "Hello"}, metadata=PromptMetadata(model=ModelMetadata(name="models/gemini-pro", settings={})))]  # type: ignore

    # One shot list of strings
    gemini_args_dict = {"contents": ["hello", "world"]}
    prompts = await aiconfig.serialize(model_name="gemini-pro", data=gemini_args_dict, prompt_name="prompt")
    assert prompts == [Prompt(name="prompt", input=["hello", "world"], metadata=PromptMetadata(model=ModelMetadata(name="models/gemini-pro", settings={})))]  # type: ignore

    # Multi Turn Dict of strings
    gemini_args_dict = {
        "contents": [
            {"role": "user", "contents": "Hello"},
            {"role": "model", "parts": "Hi!"},
            {"role": "user", "parts": "What's your favorite condiment?"},
        ]
    }
    prompts = await aiconfig.serialize(model_name="gemini-pro", data=gemini_args_dict, prompt_name="prompt")
    assert prompts == [Prompt(name="prompt", input="hello", metadata=PromptMetadata(model=ModelMetadata(name="models/gemini-pro", settings={})), outputs=[]), Prompt(name="prompt", input="hi")]  # type: ignore


@pytest.mark.asyncio
async def test_deserialize():
    # NOT IMPLEMENTED
    pass


@pytest.mark.asyncio
async def test_run():
    """
    Test Run. This test mocks the async stream call of the gemini api
    """

    # NOT IMPLEMENTED
    pass
