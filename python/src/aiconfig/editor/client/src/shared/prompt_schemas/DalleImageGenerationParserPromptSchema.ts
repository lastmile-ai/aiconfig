import { PromptSchema } from "../../utils/promptUtils";

export const Dalle2ImageGenerationParserPromptSchema: PromptSchema = {
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
      response_format: {
        type: "string",
        enum: ["url", "b64_json"],
        description: "The format in which the generated images are returned.",
      },
      size: {
        type: "string",
        enum: ["256x256", "512x512", "1024x1024"],
        description: "The size of the generated images.",
      },
      user: {
        type: "string",
        description: `A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse.`,
      },
    },
  },
};

export const Dalle3ImageGenerationParserPromptSchema: PromptSchema = {
  // Override Dalle2 schema with properties specific to Dalle3
  // See https://platform.openai.com/docs/api-reference/images/create
  ...Dalle2ImageGenerationParserPromptSchema,
  model_settings: {
    type: "object",
    properties: {
      ...Dalle2ImageGenerationParserPromptSchema.model_settings!.properties,
      quality: {
        type: "string",
        enum: ["standard", "hd"],
        description: `The quality of the image that will be generated. 
        'hd' creates images with finer details and greater consistency across the image`,
      },
      size: {
        type: "string",
        enum: ["1024x1024", "1792x1024", "1024x1792"],
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
