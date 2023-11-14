# Building a Generative AI App with LastMile AI (Stanford x LastMile AI)

This workshop walks you through how to build a generative AI app with open-source LastMile AI tools.
Workshop Date: November 14, 2023

## Tools

**AI Workbooks**: a notebook-like editor for prompt engineering and model experimentation. You can chain prompts, parametrize prompts, and iterate on model parameters.
**AI Config**: a standardized JSON file format to manage your prompts, models, and model parameters as configs. It allows you to store and iterate on generative AI model behavior separately from your application code.

## What are we building?

We are building an AI teaching assistant app to showcase prompt engineering, prompt routing, function calling, and RAG (retrieval-augmented geneartion).

## Setup Instructions

1. Clone this [AI Workbook](https://lastmileai.dev/workbooks/clowg4ywg00daqpf2cvyz9z0g) and rename the workbook to `{your_name}_lastmile_workshop`.
2. Clone this [Google Colab Notebook](https://colab.research.google.com/drive/1bhG2YbBI4q3ZhoEZ_LdflLf-AkV9WWc9): File > Save a Copy in Drive. Rename to `{Your Name} LastMile Workshop`.

## Tutorial

1. Start with this AI Workbook to prototype your prompts, prompt chains, and model parameters.
2. Dowload the AI Config from the workbook.
3. Upload the AIConfig to your Google Colab Notebook Files: '{your_name}\_lastmile_workshop.json'
4. Follow the instructions in the Google Colab Notebook.

## Apply for Raffle

Submit your Workshop Colab Notebook to this [spreadsheet](https://docs.google.com/spreadsheets/d/1c38NgDS0IIlYyuiHuCnCU_iWYE1TsxVwkOt_iMM9cdg/edit#gid=0).

## Win a $100 Amazon Gift Card - Stanford LastMile Challenge

Build a project that uses AI Config (and AI workbooks).

Deadline: Novemeber 28th 12:00AM PST

Read instructions [here](https://github.com/lastmile-ai/aiconfig/blob/main/workshops/Stanford/competition/README.md).

# Key Concepts

**Prompt Engineering**
Designing and optimizing prompts to effectively communicate with AI models helps ensure that they understand and respond accurately to user inputs. There are several [prompt engineering techniques](https://www.promptingguide.ai/) such as zero-shot, few-shot, chain-of-thought, and tree-of-thoughts. AI Workbooks are a great way to prototype your prompts, prompt chains, and compare different model responses.

**Prompt Routing**
Prompt routing directs a user's prompt to the most suitable AI model or system, based on the nature of the request, to achieve the most accurate and relevant response. An LLM is usually the router in this case to make the decision of which system to call based on the user prompt.

**Function Calling**
You can describe functions to OpenAI LLMs (`gpt-4-0613` and `gpt-3.5-turbo-0613`) and have the model intelligently choose to output a JSON object containing arguments to call those functions. This is one way to connect GPT's capabilities with external tools and APIs. Read more [here](https://openai.com/blog/function-calling-and-other-api-updates).

**Retrieval-Augmented Generation (RAG)**
RAG provides a way to optimize the output of an LLM with targeted information without modifying the underlying model itself; that targeted information can be more up-to-date than the LLM as well as specific to a particular organization and industry.
