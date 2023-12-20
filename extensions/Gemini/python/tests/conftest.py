from typing import Any

# Mocked Responses is a list that contains tuples of (request, response)
mocked_responses: list[tuple[dict, Any]] = [({}, {})]


def mock_async_generate_content(**kwargs):
    return "mocked content"
