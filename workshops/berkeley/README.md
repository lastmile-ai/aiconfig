# Building a Generative AI App (Berkeley x LastMile AI)

This workshop walks you through how to build a generative AI app with open-source LastMile AI tools.
Workshop Date: November 14, 2023

## Tools

**AI Workbooks**: a notebook-like editor for prompt engineering and model experimentation. You can chain prompts, parametrize prompts, and iterate on model parameters.

**AI Config**: a standardized JSON file format to manage your prompts, models, and model parameters as configs. It allows you to store and iterate on generative AI model behavior separately from your application code.

## What are we building?

We are building an AI teaching assistant app to showcase prompt engineering, prompt routing, function calling, and RAG (retrieval-augmented generation).

## Setup Instructions

1. Go to [LastMile AI](https://lastmileai.dev) and sign up for a free account to get access to AI Workbooks.
2. Create a [new workbook](https://lastmileai.dev/workbooks/workshop), experiment with some prompts, parameters, and system prompt.
3. Go to this [AI Workbook](https://lastmileai.dev/workbooks/clp1pp4ut0001pevg26halowt).
4. Download the AIConfig .json.
5. Clone the same [AI Workbook](https://lastmileai.dev/workbooks/clp1pp4ut0001pevg26halowt) and follow the workshop.
6. Clone this [Google Colab Notebook](https://colab.research.google.com/drive/1TJElvL1u_N3SmKsiSh-NMxyIu41DgJ_a#scrollTo=arj-rect6Z9r): File > Save a Copy in Drive. Rename to `{Your Name} LastMile Workshop`.

## Tutorial

1. Start with the AI Workbook to prototype your prompts, prompt chains, and model parameters.
2. Upload the AIConfig to your Google Colab Notebook Files: 'berkeley_lastmile_workshop_aiconfig.json'
3. Follow the instructions in the Google Colab Notebook.

## Apply for Raffle

Submit your Workshop Colab Notebook to this [spreadsheet](https://docs.google.com/spreadsheets/d/1mm_enz6Yh-qh3Sb3COteXmn2XUZEUQ_dhbQ0ECwTTYk/edit#gid=0).

## Win a $100 Amazon Gift Card - Berkeley LastMile Challenge

Build a project that uses AI Config (and AI workbooks).

Deadline: Novemeber 28th 12:00AM PST

Read instructions [here](https://github.com/lastmile-ai/aiconfig/blob/main/workshops/berkeley/competition/README.md).

# Key Concepts

**Prompt Engineering**
Designing and optimizing prompts to effectively communicate with AI models helps ensure that they understand and respond accurately to user inputs. There are several [prompt engineering techniques](https://www.promptingguide.ai/) such as zero-shot, few-shot, chain-of-thought, and tree-of-thoughts. AI Workbooks are a great way to prototype your prompts, prompt chains, and compare different model responses.

**Prompt Routing**
Prompt routing directs a user's prompt to the most suitable AI model or system, based on the nature of the request, to achieve the most accurate and relevant response. An LLM is usually the router in this case to make the decision of which system to call based on the user prompt.

**Function Calling**
You can describe functions to OpenAI LLMs (`gpt-4-0613` and `gpt-3.5-turbo-0613`) and have the model intelligently choose to output a JSON object containing arguments to call those functions. This is one way to connect GPT's capabilities with external tools and APIs. Read more [here](https://openai.com/blog/function-calling-and-other-api-updates).

**Retrieval-Augmented Generation (RAG)**
RAG provides a way to optimize the output of an LLM with targeted information without modifying the underlying model itself; that targeted information can be more up-to-date than the LLM as well as specific to a particular organization and industry.
