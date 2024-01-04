import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceTextGenerationParserPromptSchema: PromptSchema = {
  // See https://github.com/huggingface/huggingface_hub/blob/a331e82aad1bc63038194611236db28fa013814c/src/huggingface_hub/inference/_client.py#L1206
  // for settings and https://huggingface.co/docs/api-inference/detailed_parameters for defaults.
  // The settings below are supported settings specified in the HuggingFaceTextGenerationParser
  // refine_chat_completion_params implementation.
  input: {
    type: "string",
  },
  model_settings: {
    type: "object",
    properties: {
      model: {
        type: "string",
      },
      temperature: {
        type: "number",
        minimum: 0,
        maximum: 1,
      },
      top_k: {
        type: "integer",
      },
      top_p: {
        type: "number",
        minimum: 0,
        maximum: 1,
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
        minimum: 0,
        maximum: 1,
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
