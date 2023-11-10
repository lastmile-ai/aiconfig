# Chain of Verification Pipeline (CoVe)

Given a user query, a LLM generates a baseline response that may contain inaccuracies, e.g. factual hallucinations. To improve this, CoVe first generates a
plan of a set of verification questions to ask, and then executes that plan by answering them and hence
checking for agreement. We find that individual verification questions are typically answered with
higher accuracy than the original accuracy of the facts in the original longform generation. Finally,
the revised response takes into account the verifications. 

Steps as outlined from [CoVe paper](https://arxiv.org/pdf/2309.11495.pdf): 
1. Generate Baseline Response 
2. Plan Verification 
3. Execute Verification
4. Generate Final Verified Response

![diagram](https://external-preview.redd.it/research-paper-meta-chain-of-verification-reduces-v0-HwB5qAQbMLEgMwIeDsL5uxKb3HUM-ekY0NdXIqaTupY.jpg?auto=webp&s=d442818b5624061de5d4776a6512784524045065)


## How to build CoVe pipeline? 
This cookbook walks through the example above (verifying politician birthplace location) using AI Config: 

1. **Start with an AI workbook to prototype your prompt chains.** For this example, the baseline prompt is "Name 25 politicians born in NY, New York", the verification prompt is "Where was {{politician}} born?", and the final verified response prompt should cross-check the response from the baseline prompt (list of 25 politicians) and the answer to the verification prompt. While the first two prompts are simple, the last one might require some iteration with the system prompt to do the cross-check. Here is the [AI Workbook](https://lastmileai.dev/workbooks/clon69opk00c1qrfiighw3k92). 
2. **Download AIConfig .json from AI Workbook.** The AIConfig will contain the prompts, chaining logic, and model parameters in a json format that we can then easily using to create the CoVE pipeline. Here is the downloaded .json from the workbook - [cove_demo_config.json](https://raw.githubusercontent.com/lastmile-ai/aiconfig/main/cookbook/Chain-of-Verification/cove_config.json).
3. **Create pipeline for chain-of-verification.** Use notebook (or code) to chain prompts from AIConfig .json and add logic (ex. for-loop to run verification prompt for each of the 25 politicians). Here is the [Colab notebook](https://colab.research.google.com/drive/1h_Cneit5S2wI4nVPKI8AWGzTadFHwDk3#scrollTo=51w-3OZC_Z97). 
