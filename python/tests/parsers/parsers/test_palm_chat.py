import pytest
from aiconfig import AIConfigRuntime, Prompt, ExecuteResult, PromptMetadata, ModelMetadata


@pytest.mark.asyncio
async def test_serialize():
    """
    Take a conversation in the format of PaLM's completion params and serialize it into AIConfig format
    Note: PaLM python Api doesn't provide a type for completion params. It takes in a dictionary
    """
    # The below params were taken from the PaLM Api library. Step into `palm.chat(**completion_data)`
    completion_params = {
        "model": "models/chat-bison-001",
        "context": "Take on the role of an expert in food",
        "examples": None,
        "messages": [
            {"author": "0", "content": "Hello"},
            {"author": "1", "content": "Hi there! How can I help you today?"},
            {"author": "0", "content": "Just chillin"},
            {
                "author": "1",
                "content": "That's great! Chilling is a great way to relax and de-stress. I hope you're having a good day.",
            },
        ],
        "temperature": None,
        "candidate_count": None,
        "top_p": 1,
        "top_k": 1,
        "prompt": None,
        "client": None,
    }

    aiconfig = AIConfigRuntime.create()

    prompts = await aiconfig.serialize(
        "models/chat-bison-001", completion_params, "prompt", {}
    )
    from pprint import pprint

    pprint([prompt.model_dump() for prompt in prompts])
    assert prompts == [
        Prompt(
            name="prompt",
            input="Hello",
            metadata=PromptMetadata(
                model=ModelMetadata(
                    name="models/chat-bison-001",
                    settings={
                        "model": "models/chat-bison-001",
                        "context": "Take on the role of an expert in food",
                        "examples": None,
                        "temperature": None,
                        "candidate_count": None,
                        "top_p": 1,
                        "top_k": 1,
                    },
                ),
                tags=None,
                parameters={},
            ),
            outputs=[
                ExecuteResult(
                    output_type="execute_result",
                    execution_count=None,
                    data="Hi there! How can I help you today?",
                    mime_type=None,
                    metadata={},
                )
            ],
        ),
        Prompt(
            name="prompt",
            input="Just chillin",
            metadata=PromptMetadata(
                model=ModelMetadata(
                    name="models/chat-bison-001",
                    settings={
                        "model": "models/chat-bison-001",
                        "context": "Take on the role of an expert in food",
                        "examples": None,
                        "temperature": None,
                        "candidate_count": None,
                        "top_p": 1,
                        "top_k": 1,
                    },
                ),
                tags=None,
                parameters={},
            ),
            outputs=[
                ExecuteResult(
                    output_type="execute_result",
                    execution_count=None,
                    data="That's great! Chilling is a great way to relax and de-stress. I hope you're having a good day.",
                    mime_type=None,
                    metadata={},
                )
            ],
        ),
    ]
