# Summary

- Build a custom CLI chat bot using AIConfig. Primary use case is interactive code modification, but can be used as a general-purpose chat bot.
- Use simple AIConfig runtime API to run an arbitrary-length sequence of prompts.
- Leverage streaming callbacks to allow gracefully interrupting LLM output and going back to the query prompt.

# Usage

## Quick start:

```
% python cookbooks/Cli-Mate/cli-mate.py -c cookbooks/Cli-Mate/cli-mate.aiconfig.json loop
Query: [ctrl-D to exit] capital  of nys
Albany
Query: [ctrl-D to exit] previous question was about?
The previous question was about the capital of New York State (NYS).
```

## With source code:

contents of python/test.py: `import open`

```
% python cookbooks/Cli-Mate/cli-mate.py -c cookbooks/Cli-Mate/cli-mate.aiconfig.json loop -scf='python/test.py '
Query: [ctrl-D to exit] summarize the code.
The given code attempts to import a module named 'open' in Python. But it seems incorrect as 'open' is a built-in function in Python to open files but not a module. This code will throw an error if executed.
# fix the code in python/test.py to `import os` while cli-mate is still running.

Query: [ctrl-D to exit] reload what does the code do now?
The code imports the module 'os' in Python.
```

Also see: `python cookbooks/Cli-Mate/cli-mate.py -h`
