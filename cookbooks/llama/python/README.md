Example app using llama aiconfig extension.

1. Install (example using anaconda)
   `conda create -n aiconfig-llama-cookbook`
   `conda activate aiconfig-llama-cookbook`
   `conda install pip`
   `pip install -r python/requirements.txt`

2. Download a model, e.g.
   `curl -L https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf --output ./models/llama-2-7b-chat.Q4_K_M.gguf`
3. cd into cookbook root dir
   `$ pwd`
   aiconfig/cookbooks/llama
4. Create an AIConfig like this: https://github.com/lastmile-ai/aiconfig/blob/e92e5a3c80b9c2b74a9432f0441318a951d54d0c/cookbooks/llama/llama-aiconfig.json
5. Run with your local paths:
   `python python/ask_llama.py --aiconfig-path='../llama/llama-aiconfig.json' --model-path='../../models/llama-2-7b-chat.Q4_K_M.gguf' 2> ask-llama.err`
