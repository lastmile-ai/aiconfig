### Chain of Verification Pipeline (CoVe)

Given a user query, a LLM generates a baseline response that may contain inaccuracies, e.g. factual hallucinations. To improve this, CoVe first generates a
plan of a set of verification questions to ask, and then executes that plan by answering them and hence
checking for agreement. We find that individual verification questions are typically answered with
higher accuracy than the original accuracy of the facts in the original longform generation. Finally,
the revised response takes into account the verifications. Steps as outlined from this [paper](https://arxiv.org/pdf/2309.11495.pdf). 
1. Generate Baseline Response 
2. Plan Verification 
3. Execute Verification
4. Generate Final Verified Response

**Workflow**
1. Started with prompts in [AI Workbook](https://lastmileai.dev/workbooks/clon69opk00c1qrfiighw3k92). 
2. Downloaded AIConfig (prompts, model params) from workbook - [cove_demo_config.json](https://drive.google.com/file/d/1GXahbgGCV_HReL3hWVZ2L5tVXn_3Iinf/view?usp=sharing) 
3. Create pipeline for chain-of-verification in [Colab notebook](https://colab.research.google.com/drive/1h_Cneit5S2wI4nVPKI8AWGzTadFHwDk3#scrollTo=51w-3OZC_Z97)