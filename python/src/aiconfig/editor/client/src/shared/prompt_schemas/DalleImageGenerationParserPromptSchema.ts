import { PromptSchema } from "../../utils/promptUtils";

export const DalleImageGenerationParserPromptSchema: PromptSchema = {
  // See /opt/homebrew/Caskroom/miniconda/base/envs/aiconfig/lib/python3.12/site-packages/openai/resources/images.py
  // for supported settings

  input: {
    type: "string",
  },
  model_settings: {
    type: "object",
    properties: {
      model: {
        type: "string",
      },
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
