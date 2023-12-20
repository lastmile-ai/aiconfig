import lastmile_utils.lib.core.api as core_utils


class MockRealCompletions:
    create = "real"


class MockRealChat:
    completions = MockRealCompletions()


class MockRealOpenAI:
    """
    We have to mock the real openAI to test the actual mock because the real openai needs an API key.
    """

    some_real_field: str = "the_real_value"
    chat = MockRealChat()


def test_wrap_openai_module():
    api = MockRealOpenAI()
    mock = core_utils.make_wrap_object(api, "chat.completions.create", "mock")
    assert mock.chat.completions.create == "mock"
    assert mock.some_real_field == "the_real_value"
