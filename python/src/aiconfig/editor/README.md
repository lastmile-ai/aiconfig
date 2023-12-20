# Editor

# Install:

Install python-aiconfig from pip, then set `aiconfig` alias (in shell, .bashrc, .zshrc, etc.)

One-liner:
`pip install python-aiconfig; alias aiconfig="python -m 'aiconfig.scripts.aiconfig'"`

## Usage

`aiconfig edit  --aiconfig-path=/my/path'`

```
[INFO] 2023-12-18 23:54:14,379 server.py:32: Edit config: {
  "server_port": 8888,
  "aiconfig_path": "/my/path"
}
[INFO] 2023-12-18 23:54:14,379 server.py:33: Editor server running on http://localhost:8888
```

Go to url in browser to use app.

## Dev

1. Edit
   Server code: `python/src/editor/server/server.py`
   Client code: `aiconfig/python/src/editor/client/src`

2. Build react app: `npm run build`

3. Rerun server (see usage)

`python -m 'aiconfig.scripts.aiconfig'`
go to url (e.g. localhost:8080)