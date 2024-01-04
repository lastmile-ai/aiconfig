import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceTextGenerationParserPromptSchema: PromptSchema = {
  input: {
    type: "string",
  },
  model_settings: {
    type: "object",
    properties: {
      temperature: {
        type: "number",
      },
      top_k: {
        type: "integer",
      },
      top_p: {
        type: "number",
      },
      details: {
        type: "boolean",
      },
      stream: {
        type: "boolean",
      },
      do_sample: {
        type: "boolean",
      },
      max_new_tokens: {
        type: "integer",
      },
      best_of: {
        type: "integer",
      },
      repetition_penalty: {
        type: "number",
      },
      return_full_text: {
        type: "boolean",
      },
      seed: {
        type: "integer",
      },
      stop_sequences: {
        type: "array",
        items: {
          type: "string",
        },
      },
      truncate: {
        type: "integer",
      },
      typical_p: {
        type: "number",
      },
      watermark: {
        type: "boolean",
      },
    },
  },
};
