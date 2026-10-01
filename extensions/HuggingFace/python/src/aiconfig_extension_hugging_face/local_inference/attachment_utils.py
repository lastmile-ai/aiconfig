from typing import Any


def require_attachments(prompt_input: Any, prompt_name: str, media_description: str) -> list[Any]:
    """Return attachments or raise the parser's user-facing validation error."""
    attachments = getattr(prompt_input, "attachments", None)
    if not attachments:
        raise ValueError(
            f"No attachments found in input for prompt '{prompt_name}'. "
            f"Please add {media_description} attachment to the prompt input."
        )
    return attachments
