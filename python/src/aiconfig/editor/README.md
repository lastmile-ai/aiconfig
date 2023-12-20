# Editor

## Usage (prod)

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

## Dev

### Install:


`pip install -e path/to/local/aiconfig/python`
`alias aiconfig="python -m 'aiconfig.scripts.aiconfig_cli'"``

2. Run backend and frontend servers:

`aiconfig edit  --aiconfig-path=/my/path --server-port=8080 --server-mode=debug`


3. go to url (e.g. localhost:8080)

4. Edit react and/or flask code. Both should hot reload (just refresh localhost).