# Gradio Workbook Editor

## Prompt IDE with LastMile AI

This cookbook is meant to demonstrate the AI Workbook editor that can be run on your local machine. It can run inference against locally hosted or remote models from many inference providers, including Hugging Face, OpenAI and others.

It supports any modality, and allows chaining together different models in a single notebook interface.

With `aiconfig`, it lets you save the state in a source control friendly format which you can share with others.

And you can use the AIConfig SDK to use your generated `.aiconfig.json` in your application, providing a single interface to run inference across any model/modality/provider.

## Tech Stack

What you see here is a "local editor" -- a React frontend and a Flask server which allow you to edit `.aiconfig.json` files in a notebook-like editor.

- Frontend code:

### Gradio custom component

The Gradio custom component is currently WIP.

**Note**: We already have the Gradio backend that corresponds to the Flask server in the [`gradio-workbook`](https://github.com/lastmile-ai/gradio-workbook) repo.

We are working on using `sveltris` to package our React frontend to work with Gradio. Once that works, the same experience you see in this cookbook will be possible inside a Gradio custom component.

## Getting Started

**Instructions**:

## Instructions

Follow the tutorial to get started [here](https://aiconfig.lastmileai.dev/docs/getting-started).

## Resources

Tutorial Video

[![Watch the video](https://img.youtube.com/vi/X_Z-M2ZcpjA/default.jpg)](https://www.youtube.com/watch?v=X_Z-M2ZcpjA)

Tutorial Implementation:

- [Python - Google Colab notebook](https://colab.research.google.com/drive/1aZiEgiPiIDPmy7iD4xPcNw0BBcfC2e1S)
- Typescript (to be added)

Files:

- AI Config (`travel.aiconfig.json`)

Playground for Prompts:

- [AI Workbook - NYC Travel Itinerary](https://lastmileai.dev/workbooks/clooqs3p200kkpe53u6n2rhr9)
