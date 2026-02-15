import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceVisualQuestionAnsweringRemoteInferencePromptSchema: PromptSchema =
  {
    // See https://github.com/huggingface/huggingface_hub/blob/main/src/huggingface_hub/inference/_client.py#L1780 for supported params.
    // The settings below are supported settings specified in the HuggingFaceVisualQuestionAnsweringRemoteInference refine_completion_params implementation.
    input: {
      type: "object",
      required: ["attachments", "data"],
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
        data: {
          // The question to ask about the image
          type: "string",
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
          default: "dandelin/vilt-b32-finetuned-vqa",
        },
      },
    },
  };
