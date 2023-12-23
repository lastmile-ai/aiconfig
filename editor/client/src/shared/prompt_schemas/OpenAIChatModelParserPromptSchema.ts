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
      },
      functions: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "parameters"],
          parameters: {
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
      },
      max_tokens: {
        type: "integer",
        maximum: 4096,
        minimum: 16,
        default: 4096,
      },
      n: {
        type: "integer",
      },
      presence_penalty: {
        type: "number",
        minimum: -2.0,
        maximum: 2.0,
      },
      stop: {
        type: "array",
        items: {
          type: "string",
        },
      },
      stream: {
        type: "boolean",
      },
      temperature: {
        type: "number",
        minimum: 0.0,
        maximum: 2.0,
      },
      top_p: {
        type: "number",
        minimum: 0.0,
        maximum: 1.0,
      },
      user: {
        type: "string",
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
