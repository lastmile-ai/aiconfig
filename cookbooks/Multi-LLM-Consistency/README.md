# Multi LLM consistency

Given a chain of thought prompt, multiple LLMs can be used to drive consistency across different LLMs, thus improving the accuracy of the final output. Initially, the same chain of thought prompt is passed across multiple different LLMs (GPT4, PaLM2, etc.). Afterwards, quorum is determined, which in this example is through GPT4 as the quorum evaluator, but can be programmed using other methodologies.

Steps inspired from the [Self Consistency paper](https://arxiv.org/pdf/2203.11171.pdf): 
1. Sample a diverse set of reasoning paths across multiple LLMs (paper uses a single language model)
2. Select best response based on quorum


### Self-Consistency improves Chain of Thought Reasoning in Language Models
![original self-consistency diagram](https://blog.marvik.ai/wp-content/uploads/2023/07/Screenshot-2023-08-01-at-16.31.57.png)

### Multi-LLM Consistency Reasoning across Language Models
![updated diagram for multi-LLM](https://drive.google.com/uc?export=view&id=1S1omwPMOEeUbaizvSw0FvlIOMPSKnHIH)

## How to build Multi LLM Consistency pipeline? 
This cookbook walks through the example above (quorum based consistency for a tricky math question) using AI Config: 

1. **Start with an AI workbook to prototype your prompt chains.** For this example, the prompt is `Q: When I was 6 my sister was half my age. Now I’m 70 how old is my sister? A:` with few-shot prompting in the system prompt ```Q: Shawn has five toys. For Christmas, he got two toys each from his mom and dad. How many toys does he have now? A: He has 5 toys. He got 2 from mom, so after that he has 5 + 2 = 7 toys. Then he got 2 more from dad, so in total he has 7 + 2 = 9 toys. The answer is 9.```
Here is the [AI Workbook](https://lastmileai.dev/workbooks/cloox6crb005hqr1i9c31qqmy).

2. **Download AIConfig .json from AI Workbook.** The AIConfig will contain the prompts, chaining logic, and model parameters in a json format that we can then easily using to create the CoVE pipeline. Here is the downloaded .json from the workbook - [multi_llm_consistency.json](https://drive.google.com/file/d/1GcSF1ZmvcBp6LcDNzIcwH1ytpQmHac95/view?usp=drive_link).
3. **Create pipeline for chain-of-verification.** Use notebook (or code) with `aiconfig` library with the `multi_llm_consistency.json` and optionally, add custom quorum evaluator. Here is the [Colab notebook](https://colab.research.google.com/drive/1QYGyiIIfx9nmLp4QFUkebygUF5R8RNwj#scrollTo=nat03JkI9Dw2). 
