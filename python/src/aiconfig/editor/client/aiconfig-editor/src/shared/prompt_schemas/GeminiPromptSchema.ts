import { PromptSchema } from "../../utils/promptUtils";
// This does not support Gemini Vision. Model parser does not support it.
// TODO: Safety Settings, Candidate Count, max_output_tokens
export const GeminiParserPromptSchema: PromptSchema = {
  // https://ai.google.dev/api/python/google/ai/generativelanguage/GenerationConfig
  input: {
    type: "string",
  },
  model_settings: {
    type: "object",
    properties: {
      generation_config: {
        type: "object",
        properties: {
          candidate_count: {},
          temperature: {
            type: "number",
            description: "Controls the randomness of the output.",
            minimum: 0.0,
            maximum: 1.0,
          },
          top_p: {
            type: "number",
            description:
              "The maximum cumulative probability of tokens to consider when sampling.",
          },
          top_k: {
            type: "integer",
            description:
              "The maximum number of tokens to consider when sampling.",
          },
          stop_sequences: {
            type: "array",
            description:
              "The set of character sequences (up to 5) that will stop output generation",
            items: {
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
      stream: {
        type: "boolean",
      },
    },
  },
};
