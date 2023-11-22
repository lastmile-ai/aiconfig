import asyncio
import os

import openai
import streamlit as st
from dotenv import load_dotenv

from aiconfig import AIConfigRuntime

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# Get assistant response based on user prompt (prompt routing)
async def assistant_response(prompt):
    config = AIConfigRuntime.load("assistant_aiconfig.json")

    params = {"student_question": prompt}

    router_prompt_completion = await config.run("router", params)
    topic = config.get_output_text("router")

    dest_prompt = topic.lower()

    prompt_completion = await config.run(dest_prompt, params)
    response = config.get_output_text(dest_prompt)

    return(response)

# Streamlit Setup
st.title("AI Teaching Assistant")
st.markdown("Ask a math, physics, or general question. Based on your question, an AI math prof, physics prof, or general assistant will respond.")
st.markdown("**This is a simple demo of prompt routing - based on your question, an LLM decides which AI teacher responds.**")

# Chat setup
if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("Ask a math, physics, or general question"):
    st.chat_message("user").markdown(prompt)
    st.session_state.messages.append({"role": "user", "content": prompt})

    chat_response = asyncio.run(assistant_response(prompt))

    response = f"AI: {chat_response}"

    with st.chat_message("assistant"):
        st.markdown(response)

    st.session_state.messages.append({"role": "assistant", "content": response})


