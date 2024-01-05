from aiconfig.util.config_utils import maybe_get_api_key_from_environment


def test_maybe_get_api_key_from_environment():
    key = "TEST_API_KEY"
    try:
        maybe_get_api_key_from_environment(key)
    except Exception:
        pass  # The expected exception was raised, so do nothing
    else:
        raise AssertionError("ExpectedException was not raised")
