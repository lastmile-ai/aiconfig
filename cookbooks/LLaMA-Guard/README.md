# LLaMA Guard

[![colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1CfF0Bzzkd5VETmhsniksSpekpS-LKYtX)

[LLaMA Guard](https://ai.meta.com/research/publications/llama-guard-llm-based-input-output-safeguard-for-human-ai-conversations/) is an LLM-based input-output safeguard model.

This example shows how to use AIConfig to wrap GPT-3.5 calls with LLaMA Guard and classify them as safe or unsafe.

LLaMA Guard allows you to define your own “safety taxonomy” — custom policies for what is safe vs unsafe interactions between humans (prompts) and AI (responses).

The colab runs a bunch of prompts with ChatGPT (a mixture of innocuous and inappropriate) and asks LLaMA Guard to classify the interactions as safe/unsafe.

What makes this really cool is it allows you to have very specific set of policies you can enforce _ON TOP_ of the standard guardrails that a model ships with. LLaMA Guard makes this possible.

Youtube Video walkthrough: https://www.youtube.com/watch?v=XxggqoqIVdg
