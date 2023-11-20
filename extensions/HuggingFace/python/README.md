# HuggingFace Text Generation AIConfig ModelParser Extension

## Overview

This package is a lightweight ModelParser extension for AIConfig which provides support for running HuggingFace Text Generation Models in AIConfig prompts. Most Text Generation models from https://huggingface.co/models?pipeline_tag=text-generation should be supported. Under the hood, this package leverages [HuggingFace Hub Library](https://huggingface.co/docs/huggingface_hub/index) for prompt execution.

## Install

```
pip install python-aiconfig
pip install aiconfig-extension-huggingface-textgeneration
```

## Load Model

```
parser = new HuggingFaceTextGenerationModelParser()
```

This parser is generalizable to any of the Text Generation models.

## Example Usage
