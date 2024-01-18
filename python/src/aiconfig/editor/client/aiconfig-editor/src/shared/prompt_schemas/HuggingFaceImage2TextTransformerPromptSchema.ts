import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceImage2TextTransformerPromptSchema: PromptSchema = {
  // See https://github.com/huggingface/transformers/blob/cbbe30749b425f7c327acdab11473b33567a6e26/src/transformers/pipelines/image_to_text.py#L83
  // for settings and defaults. The settings below are supported settings
  // specified in the HuggingFaceImage2TextTransformer
  // refine_completion_params implementation.
  input: {
    type: "object",
    required: ["data"],
    properties: {
      attachments: {
        type: "array",
        items: {
          type: "attachment",
          required: ["data"],
          mime_types: ["image/png"],
          properties: {
            data: {
              type: "string",
            },
          },
        },
        max_items: 1,
      },
    },
  },
  model_settings: {
    type: "object",
    properties: {
      model: {
        type: "string",
        description: `Hugging Face model to use`,
      },
      max_new_tokens: {
        type: "integer",
        description: `The amount of maximum tokens to generate. 
        By default it will use \`generate\` default.`,
      },
      timeout: {
        type: "number",
        description: `The maximum time in seconds to wait for fetching images 
        from the web. If None, no timeout is set and the call may block forever.`,
      },
    },
  },
};
