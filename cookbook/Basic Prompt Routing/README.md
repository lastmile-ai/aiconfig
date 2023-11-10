# Basic Prompting Routing Demo - AI Teaching Assistant

This demo shows how a simple use case of prompt routing with AI config.

### How does it work?

The user asks a question. The LLM decides the topic as math, physics, or general. Based on the topic, the LLM selects a different "assistant" to respond. These assistants have different system prompts and respond with varying introductions and style of response.

### Setup with AIConfig

1. Create an AIConfig for the prompts, models, and model parameters to be used for the different assistants: `create_config.py`.
2. Build assistant app to handle prompt routing logic among the prompts (uses AIConfig): `assistant_app.py`.
