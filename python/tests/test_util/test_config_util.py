from aiconfig.util.config_utils import get_api_key_from_environment


def test_get_api_key_from_environment():
    key = "TEST_API_KEY"
    try:
        get_api_key_from_environment(key)
    except Exception as e:
        pass  # The expected exception was raised, so do nothing
    else:
        raise AssertionError("ExpectedException was not raised")