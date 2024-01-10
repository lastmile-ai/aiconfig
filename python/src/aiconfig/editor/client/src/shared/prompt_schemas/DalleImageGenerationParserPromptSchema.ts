import { PromptSchema } from "../../utils/promptUtils";

export const DalleImageGenerationParserPromptSchema: PromptSchema = {
  // See /opt/homebrew/Caskroom/miniconda/base/envs/aiconfig/lib/python3.12/site-packages/openai/resources/images.py
  // for supported settings
  // https://platform.openai.com/docs/api-reference/images/create for descriptions

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
        description: "Number of images to generate",
      },
      quality: {
        type: "string",
        enum: ["standard", "hd"],
        description: `The quality of the image that will be generated. 
        'hd' creates images with finer details and greater consistency across the image`,
      },
      response_format: {
        type: "string",
        enum: ["url", "b64_json"],
        description: "The format in which the generated images are returned.",
      },
      size: {
        type: "string",
        enum: ["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"],
        description: "The size of the generated images.",
      },
      style: {
        type: "string",
        enum: ["vivid", "natural"],
        description: `The style of the generated images. Must be one of vivid or natural. 
        Vivid causes the model to lean towards generating hyper-real and dramatic images. 
        Natural causes the model to produce more natural, less hyper-real looking images.`,
      },
    },
  },
};
