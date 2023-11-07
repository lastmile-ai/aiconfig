from aiconfig import AIConfigRuntime

x = AIConfigRuntime.load("python/demo/GPT3-WhatAreTransformers-Stream-Enabled.json")

x.save()