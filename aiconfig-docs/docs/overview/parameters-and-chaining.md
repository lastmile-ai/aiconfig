---
sidebar_position: 5
---

# Parameters and Chaining Prompts

Parameters are a way to pass data into prompts. Parameters can be defined statically in the [`aiconfig` metadata](/docs/overview/ai-config-format#metadata), and also passed in dynamically when using the AIConfig SDK.

For example:

```python
params = {
  "parameter_name": "parameter_value"
}
config.run("prompt_name", params)
```
