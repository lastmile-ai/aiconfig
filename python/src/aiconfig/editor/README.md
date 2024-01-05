# Editor

## Usage (prod)

One liner for local testing; run this inside the root of aiconfig repo. Create a model parser registry py file to get started.

`python -m 'aiconfig.scripts.aiconfig_cli' edit  --aiconfig-path=../cookbooks/Getting-Started/travel.aiconfig.json --server-mode='prod' `

### Install:

Install python-aiconfig from pip, then set `aiconfig` alias (in shell, .bashrc, .zshrc, etc.)

One-liner:
`pip install python-aiconfig; alias aiconfig="python -m 'aiconfig.scripts.aiconfig_cli'"`

### Run

`aiconfig edit  --aiconfig-path=/my/path'`

```
[INFO] 2023-12-18 23:54:14,379 server.py:32: Edit config: {
  "server_port": 8080,
  "aiconfig_path": "/my/path"
}
[INFO] 2023-12-18 23:54:14,379 server.py:33: Editor server running on http://localhost:8080
```

Go to url in browser to use app.

### Loading model parsers

To use a model parser that doesn't ship with aiconfig: 0. Make sure your model parser package is installed, e.g.
`pip install python-aiconfig-llama`, or
`pip install -e path/to/my/local/parser/package`

1. Make a Python file e.g. my_editor_plugin.py. It must define a () -> None called `register_model_parsers.
   Example:

```
from aiconfig import AIConfigRuntime
from llama import LlamaModelParser


def register_model_parsers() -> None:
    model_path = "/Users/jonathan/Projects/aiconfig/models/llama-2-7b-chat.Q4_K_M.gguf"
    llama_model_parser = LlamaModelParser(model_path)
    AIConfigRuntime.register_model_parser(llama_model_parser, "llama-2-7b-chat")
```

2. Run aiconfig edit server with `--parsers-module-path="/path/to/my_editor_plugin.py"`

e.g. `aiconfig edit --parsers-module-path="/path/to/my_editor_plugin.py"`

3. Use editor as usual.

## Dev

### Install:

From the top-level `aiconfig` dir:
```bash
pip3 install -e ./python
alias aiconfig="python -m 'aiconfig.scripts.aiconfig_cli'"
```

### Run backend and frontend servers:
Replace the `aiconfig_path` variable with the path to your AIConfig file. 
For example: `cookbooks/Getting-Started/travel.aiconfig.json`
```bash
cd python/src/aiconfig/editor/client && rm -rf node_modules
cd ../../../../..
aiconfig_path="cookbooks/Getting-Started/travel.aiconfig.json"

# Use debug mode to run the frontend react server
aiconfig edit --aiconfig-path=$aiconfig_path --server-port=8080 --server-mode=debug_servers 
```

More info:
`aiconfig --help`
`aiconfig edit --help`

### Frontend

Use React server localhost:3000

### Backend

Tip: use `--server-mode=debug_backend`
Server will hot reload when you save file. Recommend disabling autosave.

Send POST requests from

- curl (https://stackoverflow.com/questions/22947905/flask-example-with-post)
- Chrome dev tools (https://stackoverflow.com/questions/14248296/making-http-requests-using-chrome-developer-tools)
- Jupyter:

```
import requests
url = 'http://localhost:8080/api/add_prompt'
data = {
        "prompt_name": "gen_packing_list",
        "prompt_data": {

        }
    }
response = requests.post(url, json=data)
print(f"{response=}"),

import json
response_json = json.loads(response.text)
message, output = response_json['message'], response_json['output']
print(f"{message=}")
print("output:")
print(output)
```
