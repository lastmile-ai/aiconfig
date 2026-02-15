import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceImage2TextRemoteInferencePromptSchema: PromptSchema = {
  // See https://github.com/huggingface/huggingface_hub/blob/main/src/huggingface_hub/inference/_client.py#L731for supported params.
  // The settings below are supported settings specified in the HuggingFaceImage2TextRemoteInference refine_completion_params implementation.
  input: {
    type: "object",
    required: ["data"],
    properties: {
      attachments: {
        type: "array",
        items: {
          type: "attachment",
          required: ["data"],
          mime_types: ["image/*"],
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
        description: `Hugging Face model to use. Can be a model ID hosted on the Hugging Face Hub or a URL 
        to a deployed Inference Endpoint`,
        default: "Salesforce/blip-image-captioning-base",
      },
    },
  },
};
