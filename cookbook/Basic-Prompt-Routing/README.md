# Basic Prompting Routing - AI Teaching Assistant

This demo shows prompt routing with AIConfig. We used streamlit to host the app so you can interact with the assistant!

![image](https://github-production-user-asset-6210df.s3.amazonaws.com/81494782/282203473-f779feb6-339d-4331-9aed-1761b845100a.png)

### How does it work?

The user asks a question. The LLM decides the topic as math, physics, or general. Based on the topic, the LLM selects a different "assistant" to respond. These assistants have different system prompts and respond with varying introductions and style of response.

### Setup with AIConfig

- `create_config.py` - create an AIConfig for the prompts, models, and model parameters to be used for the different assistants.
- `assistant_aiconfig.json` - generated automatically from running create_config.py
- `assistant_app.py` - build app to handle prompt routing logic among the prompts (uses AIConfig). Uses streamlit to create frontend.

### Run with Streamlit

`streamlit run assistant_app.py`
