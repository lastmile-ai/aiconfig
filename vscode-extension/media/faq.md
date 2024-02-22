# FAQ / Troubleshooting

Whenever you encounter errors, they should show up in the Output channel. Access it by following these steps:

1.  Press keys "CMD" + "Shift" + P
2.  Type and enter "Output: Show Output Channels"
3.  Type and enter "AIConfig"

**Q: I'm seeing a blank page when I run "AIConfig: Create New"**  
A: This likely means either:

1.  Missing or outdated python modules
    - Make sure you're on version >= 0.0.6 for AIConfig Editor extension
    - Type `pip3 list | grep aiconfig` in terminal and make sure you have `python-aiconfig` >= 1.1.22. If it's not on >=1.1.22, run `pip3 install python-aiconfig --force-reinstall`
    - Check the output channel for more info (see instructions at beginning of "FAQ / Troubleshooting")
2.  You are running AIConfig Editor with the wrong Python interpreter
    - Make sure you have Python >=3.10 installed
    - After you try to create a new file, and viewing blank screen, open command palette ("CMD" + "SHIFT" + P) and run the command `AIConfig: Initialize Extension` to ensure everything is properly configured

**Q: Got this error: "Failed to start aiconfig server. You can view the aiconfig but cannot modify it."**  
A: This can happen when trying to open a config file. You can usually fix this by:

1.  Re-opening the file
    - If you still see this error but the file opens and works, you can ignore this for now
2.  Running the steps to make sure your Python pacakges are properly initialized and up-to-date
    - Follow instructions for "I'm seeing a blank page" issue from above

**Q: What is AIConfig?**  
A: AIConfig files are files in JSON or YAML format where you can define the structure of generative AI workflows. Each AIConfig file contains a set of prompts which define what AI model to use and what data (ex: input settings, prompt parameters) to pass into the model when calling it. It also contains the output for that call if it exists. AIConfigs are pretty gnarley because they let you:

1.  Use any model
    - OpenAI: ChatGPT and Dall-E
    - Google: Gemini
    - Anthropic: Claude
    - HuggingFace: Text-to-Image, Image-to-Text, Automatic Speech Recognition, Text-to-Speech, etc.
    - and many more!
2.  Chain prompts together
    - You can use the output of one prompt as the input to another
3.  Decouple AI configuration from application code
    - Normally if you want to use AI model APIs in code, you need to call into them directly. But with AIConfig, that's all handled for you, so you only need to use [2 lines in your application code](https://aiconfig.lastmileai.dev/docs/gradio-workbook#build-apps-inspired-by-spaces) to get the results you need
