import { PromptSchema } from "../../utils/promptUtils";

export const PaLMChatParserPromptSchema: PromptSchema = {
  // See https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/text-chat for settings
  // and defaults. The settings below are supported settings specified in the PaLMChatParser
  // refine_chat_completion_params implementation.
  input: {
    type: "string",
  },
  model_settings: {
    type: "object",
    properties: {
      context: {
        type: "string",
      },
      candidate_count: {
        type: "integer",
        minimum: 1,
        maximum: 4,
      },
      temperature: {
        type: "number",
        minimum: 0,
        maximum: 1,
      },
      top_p: {
        type: "number",
        minimum: 0,
        maximum: 1,
      },
      top_k: {
        type: "integer",
        minimum: 1,
        maximum: 40,
      },
      examples: {
        type: "array",
        items: {
          type: "object",
          required: ["input", "output"],
          properties: {
            input: {
              type: "string",
            },
            output: {
              type: "string",
            },
          },
        },
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
