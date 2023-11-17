# RAG with AIConfig

This notebook demonstrates using a vector database (Chroma) with AIConfig for Retrieval-Augmented Generation (RAG). For this demo, we create a collection of curriculum for different courses for the Chroma database and use ANN (approximate nearest neighbors) to find the curriculum most relevant to a student's question. Then we use AIConfig to define a prompt named get_courses. This prompt, incorporating the student's question and the relevant curriculum, is then run to identify the appropriate classes within the curriculum that address the student's question. Read more about [AIConfig for prompt and model management](https://github.com/lastmile-ai/aiconfig).

Google Colab Notebook: https://colab.research.google.com/drive/1S6d0DDKKkf2eomZFn5-fNcpAnL5xP5kE#scrollTo=RClLTPEbyitP
