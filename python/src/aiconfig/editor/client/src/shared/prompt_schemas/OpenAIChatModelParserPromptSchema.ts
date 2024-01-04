import { PromptSchema } from "../../utils/promptUtils";

export const OpenAIChatModelParserPromptSchema: PromptSchema = {
  input: {
    type: "string",
  },
  model_settings: {
    type: "object",
    properties: {
      system_prompt: {
        type: "string",
      },
      frequency_penalty: {
        type: "number",
        minimum: -2.0,
        maximum: 2.0,
        description: `Number between -2.0 and 2.0. 
        Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.`,
      },
      function_call: {
        type: "union",
        types: [
          {
            type: "string",
            enum: ["none", "auto"],
          },
          {
            type: "object",
            required: ["name"],
            properties: {
              name: {
                type: "string",
              },
            },
          },
        ],
        description: `Controls which (if any) function is called by the model. none means the model will not call a function and instead generates a message. 
        auto means the model can pick between generating a message or calling a function. 
        Specifying a particular function via {"name": "my_function"} forces the model to call that function.
        none is the default when no functions are present. auto is the default if functions are present.`,
      },
      functions: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "parameters"],
          properties: {
            name: {
              type: "string",
            },
            parameters: {
              type: "object", // TODO: Figure this out -- it's a JSON schema object
            },
            description: {
              type: "string",
            },
          },
        },
        description: `A list of functions the model may generate JSON inputs for.`,
      },
      logit_bias: {
        type: "map",
        keys: {
          type: "string",
        },
        items: {
          type: "integer",
          minimum: -100,
          maximum: 100,
        },
        description: `Modify the likelihood of specified tokens appearing in the completion.
        Accepts a JSON object that maps tokens (specified by their token ID in the GPT tokenizer) to an associated bias value from -100 to 100. 
        You can use this tokenizer tool (which works for both GPT-2 and GPT-3) to convert text to token IDs. 
        Mathematically, the bias is added to the logits generated by the model prior to sampling. 
        The exact effect will vary per model, but values between -1 and 1 should decrease or increase likelihood of selection; 
        values like -100 or 100 should result in a ban or exclusive selection of the relevant token.
        As an example, you can pass {"50256": -100} to prevent the <|endoftext|> token from being generated.`,
      },
      max_tokens: {
        type: "integer",
        description: `The maximum number of tokens that can be generated in the completion.
        The token count of your prompt plus max_tokens cannot exceed the model's context length.`,
      },
      n: {
        type: "integer",
        description: `How many completions to generate for each prompt.
        Note: Because this parameter generates many completions, it can quickly consume your token quota. 
        Use carefully and ensure that you have reasonable settings for max_tokens and stop.`,
      },
      presence_penalty: {
        type: "number",
        minimum: -2.0,
        maximum: 2.0,
        description: `Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, 
        increasing the model's likelihood to talk about new topics.`,
      },
      stop: {
        type: "array",
        items: {
          type: "string",
        },
        description: `Up to 4 sequences where the API will stop generating further tokens. The returned text will not contain the stop sequence.`,
      },
      stream: {
        type: "boolean",
        description: `Whether to stream back partial progress. 
        If set, tokens will be sent as data-only server-sent events as they become available, with the stream terminated by a data: [DONE] message. Example Python code.`,
      },
      temperature: {
        type: "number",
        minimum: 0.0,
        maximum: 2.0,
        description: `What sampling temperature to use, between 0 and 2. 
        Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.
        We generally recommend altering this or top_p but not both.`,
      },
      top_p: {
        type: "number",
        minimum: 0.0,
        maximum: 1.0,
        description: `An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. 
        So 0.1 means only the tokens comprising the top 10% probability mass are considered.
        We generally recommend altering this or temperature but not both.`,
      },
      user: {
        type: "string",
        description:
          "A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse",
      },
    },
  },
  prompt_metadata: {
    type: "object",
    properties: {
      remember_chat_context: {
        type: "boolean",
      },
    },
  },
};
