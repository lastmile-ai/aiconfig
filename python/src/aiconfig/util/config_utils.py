import os


def get_api_key_from_environment(api_key_name: str):
    if api_key_name not in os.environ:
        raise Exception("Missing API key '{}' in environment".format(api_key_name))

    return os.environ[api_key_name]
    