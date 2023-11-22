# Promptfoo integration

Use case: I'm a SWE who wants to run my AIConfig against a set of test cases specified in a config file. Each test case has the input and a success condition of my choosing.

## Philosophy / design

Prompfoo has a pretty nice interface (both input and outputs) for addressing the use case. Tests are specified in a yaml file and the test suite can be run with a simple command. The same config file makes it easy to connect your test suite to an AI config with a small amount of code.

## How-to guide

1. Make a file `prompt.txt` that just has the contents

   `"{{question}}"`
   
    (literally, don't put any actual question there).
2. Write your test cases in a Promptfoo config file. See promtfooconfig.yaml as an example. Don't worry about "providers" for now; we'll get to that.
3. Write a "connector" script to tell Promptfoo how to test your AIConfig. For example, `travel.aiconfig.json` has the corresponding `travel.py` script.
4. Set your provider (see also step 2) to  
   `- exec:<your-exec-command>.`
   For example

```
providers:
  - exec:python travel.py
```

(Also see promptfooconfig.yaml again for a full example.)

5.  Run `npx promptfoo@latest eval`
