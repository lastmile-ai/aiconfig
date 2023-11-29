import lastmile_utils.lib.core.api as cu

import openai

def test_wrap_openai_module():
    api = openai
    new_module = cu.make_wrap_object(api, "chat.completions.create", "mock")
    assert new_module.chat.completions.create == "mock"
    assert isinstance(new_module.__version__, str)


def test_wrap_openai_client():
    api = openai.Client()
    new_client= cu.make_wrap_object(api, "chat.completions.create", "mock")
    assert new_client.chat.completions.create == "mock"
    assert isinstance(api.user_agent, str)