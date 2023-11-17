---
sidebar_position: 15
---

# Contributing Guidelines

👋 Welcome and thank you for your interest in contributing to AIConfig!

---

### **Ways to Contribute**

1. **Code Contributions**: We always welcome code contributions to the library. In particular, _model-parsers_, _extensions_, and _cookbooks_ are areas that can always use contributions.

2. **Cookbooks**: Showcase innovative ways and use cases to use AIConfig in your code through a cookbook.

3. **Bugs**: File a bug report when you encounter an issue and/or submit a fix for the bug.

4. **Feature Requests**: Submit feature or enhancement requests to help guide our roadmap.

5. **Documentation**: Contribute documentation to make it easier for others using the library.

---

### **1. Code Contributions**

```
aiconfig/
├─ cookbook/
├─ cli/
├─ editor/
├─ aiconfig-docs/
├─ python/
├─ typescript/
├─ extensions/
```

1. **Model Parsers**: Model Parsers manage the connection to foundation models. By default, we provide Model Parsers for OpenAI and Google PaLM models. The Model Parsers are defined in both `python` and `typescript`.

   Instructions for contributing a Model Parser:

   1. Add a folder under `aiconfig/extensions`
   2. Define the requirements. For `python`, you'll need to set up `pyproject.toml`. For `typescript`, you'll need a `package.json`
      > **Naming convention for the extension**: _aiconfig-extension-NAME_OF_MODEL_PARSER_
   3. Extend from `ModelParser` class, and implement `serialize`, `deserialize` and `run` functions
   4. We highly recommend adding a cookbook under `aiconfig/cookbooks` for a guide on using your Model Parser
   5. Submit a PR for the lastmile team to review the extension and cookbook
   6. Finally, publish your extension package on `pypi` and/or `npm`

2. **Extensions**: Other than Model Parsers, there are opportunities to publish extensions that can connect `aiconfig` with other useful Generative AI libraries.

---

### **2. Cookbooks**

Create a small app to add to our cookbook to showcase your use case or innovative idea.

> **Important** - Each app in the cookbook must have a _README_. We want to ensure that developers can easily use the cookbook.

Cookbook apps can be in typescript or python. And, you can decide on whether to showcase it as a _console app_, _ipython notebook_, etc.

#### **Examples:**

- [Basic Prompt Routing](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Basic-Prompt-Routing)
- [Chain of Verification](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Chain-of-Verification)
- [Wizard GPT](https://github.com/lastmile-ai/aiconfig/tree/main/cookbooks/Wizard-GPT)

---

### **3. Bugs**

#### **Bug Fixing**

We track bugs in [Github issues](https://github.com/lastmile-ai/aiconfig/labels) with the `bug` label.

- If you're a first-time contributor, a good option is to find an issue tagged [`good first issue`](https://github.com/lastmile-ai/aiconfig/labels/good%20first%20issue)
- If you're looking to fix a few bugs (we greatly appreciate it), the issues are tagged with [`bug`](https://github.com/lastmile-ai/aiconfig/labels/bug)

#### **Bug Reports**

File a bug report in [Github issues](https://github.com/lastmile-ai/aiconfig/labels) with the `bug` label. We try to triage the feature requests daily. Please include as much detail as possible in the report.

---

### **4. Feature Requests**

We track feature requests in [Github issues](https://github.com/lastmile-ai/aiconfig/labels) with the `enhancement` label. We try to triage the feature requests daily. Please include as much detail as possible in the request.

---

### **5. Documentation**

We have our documentation source controlled in the [`aiconfig/aiconfig-docs`](https://github.com/lastmile-ai/aiconfig/tree/main/aiconfig-docs) directory. The docs are published to our [LastMile AI AIConfig website](https://aiconfig.lastmileai.dev/docs/basics). Feel free to contribute documentation fixes and improvements and the LastMile team will review.
