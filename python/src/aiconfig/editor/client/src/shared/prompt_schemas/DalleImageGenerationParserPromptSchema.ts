import { PromptSchema } from "../../utils/promptUtils";

export const DalleImageGenerationParserPromptSchema: PromptSchema = {
  // "n", "quality", "response_format", "size", "style"

  input: {
    type: "string",
  },
  model_settings: {
    type: "object",
    properties: {
      n: {
        type: "integer",
        minimum: 1,
        maximum: 10,
      },
      quality: {
        type: "string",
        enum: ["standard", "hd"],
      },
      response_format: {
        type: "string",
        enum: ["url", "b64_json"],
      },
      size: {
        type: "string",
        enum: ["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"],
      },
      style: {
        type: "string",
        enum: ["vivid", "natural"],
      },
    },
  },
};
