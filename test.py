import google.generativeai as genai
from google.generativeai.types import content_types

model = genai.GenerativeModel("gemini-pro")

thing: content_types.ContentsType
response = model.generate_content(
    [
        {
            "parts": [
                "Hi!",
                "Hello",
                "Name's jeff?",
            ],
            "role": "user",
        },
        {"role": "model", "parts": ["hi"]},
        {"role": "user", "parts": ["hi"]},
    ]
)

print(response.candidates)


# Completion request coontent will have two structures

# 1. One shot. this is a list of parts
# 2. Multi-turn. this is a list of dict containing rolelists of parts
