# RAG with MongoDB and AIConfig

[![colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1_OQPq6jPD_AO3fKsYmsN4V7bNucPQuFi#scrollTo=vvmuEda4Hf0b)


This notebook is a plug-and-play RAG template using a vector database (MongoDB Atlas) with prompt templates from AIConfig for Retrieval-Augmented Generation (RAG).
Prompt templates are designed specifically for question-answering and verification - pipe in your data to customize for your use case.

Pipeline:

- Vectorize PDF and store in MongoDB Atlas
- Run prompt templates from an aiconfig.json on retrieved context
- Easily swap models (e.g. OpenAI, Google, local open-source models)

Prompt Templates

- Question-answering and verification templates. Pipe in your data to these templates to customize for your use case.

Google Colab Notebook: https://colab.research.google.com/drive/1_OQPq6jPD_AO3fKsYmsN4V7bNucPQuFi#scrollTo=IECpYFKYHf0d
