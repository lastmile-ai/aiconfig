from aiconfig import AIConfigRuntime, InferenceOptions




async def test_batch_execution():
    """
    Given an AIConfig with chained and parameterized prompt, test that the batch execution
    """
    aiconfig = AIConfigRuntime(
        **{
            "name": "Translations and Validation with GPT",
            "description": "",
            "schema_version": "latest",
            "metadata": {
                "models": {
                    "gpt-3.5-turbo": {
                        "model": "gpt-3.5-turbo",
                        "topP": 0.9,
                        "temperature": 0.9,
                    },
                    "gpt-4": {
                        "model": "gpt-4",
                        "topP": 0.9,
                        "temperature": 0.9,
                    },
                },
                "default_model": "gpt-4-0314",
                "model_parsers": {},
            },
            "prompts": [
                {
                    "name": "Translation",
                    "input": "Translate the following text into {{language}}: {{text}}",
                    "metadata": {"model": "gpt-3.5-turbo"},
                },
                {
                    "name": "Validation",
                    "input": "Validate that the following text has been successfully translated into {{language}}.  Format response in the following format: Input: Output: Result:.   Input: {{text}}, Output: {{Translation.output}}.",
                    "metadata": {
                        "model": "gpt-4"
                    },  # Different model to confirm run with dependencies, etc
                },
            ],
        }
    )

    params_list = [
        {"language": "French", "text": "Hello, my name is Todd."},
        {"language": "Spanish", "text": "Hello, my name is Todd."},
    ]
    response = await aiconfig.run_batch("Validation", params_list, options = InferenceOptions(), run_with_dependencies = True)
    print(response)

import asyncio
asyncio.run(test_batch_execution())