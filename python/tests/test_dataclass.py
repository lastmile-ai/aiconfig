from aiconfig.schema import (
    ExecuteResult,
    ModelMetadata,
    Prompt,
    PromptInput,
    PromptMetadata,
)


def test_get_raw_prompt_from_prompt_object_string_input():
    prompt = Prompt(
        name="test",
        input="This is a basic prompt",
        metadata=PromptMetadata(
            model="fake model",
            parameters={},
        ),
    )
    assert prompt.get_raw_prompt_from_config() == "This is a basic prompt"


def test_get_raw_prompt_from_prompt_object_prompt_input():
    # prompt object is constructed with input as a PromptInput object
    prompt = Prompt(
        name="test",
        input=PromptInput(
            data="This is a basic prompt",
        ),
        metadata=PromptMetadata(
            model=ModelMetadata(name="FakeMetadata", settings={}),
            parameters={},
        ),
    )
    assert prompt.get_raw_prompt_from_config() == "This is a basic prompt"


def test_add_output_initializes_none_outputs_without_duplication():
    prompt = Prompt(name="test", input="hello", outputs=None)
    output = ExecuteResult(
        output_type="execute_result", data="response", metadata={}
    )

    prompt.add_output(output)

    assert prompt.outputs == [output]
