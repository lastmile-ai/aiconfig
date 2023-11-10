# Wizard GPT - a Wizard chat app 

A GPT app for conversations between you and a riddle-speaking Wizard.

## How it works?

1. Imports and aiconfig.json that specifies the model and the system prompt - `Role: You are a wizard that gives sage advice, but in riddles. Be concise.`
2. User inputs are used to dynamically generate the prompts
3. User input prompts and output are persisted within the aiconfig file
4. Conversation history is persisted and can be resumed.
