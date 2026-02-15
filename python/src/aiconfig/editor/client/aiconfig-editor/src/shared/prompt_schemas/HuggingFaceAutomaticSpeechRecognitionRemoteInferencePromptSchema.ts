import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceAutomaticSpeechRecognitionRemoteInferencePromptSchema: PromptSchema =
  {
    // See https://github.com/huggingface/huggingface_hub/blob/main/src/huggingface_hub/inference/_client.py#L302for supported params.
    // The settings below are supported settings specified in the HuggingFaceAutomaticSpeechRecognitionRemoteInference refine_completion_params implementation.
    input: {
      type: "object",
      required: ["attachments"],
      properties: {
        attachments: {
          type: "array",
          items: {
            type: "attachment",
            required: ["data"],
            mime_types: [
              "audio/mpeg",
              "audio/wav",
              "audio/webm",
              "audio/flac",
              "audio/ogg",
              "audio/ogg",
            ],
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
          description: `Hugging Face model to use. Can be a model ID hosted on the Hugging Face Hub or a URL to a deployed Inference Endpoint`,
          default: "openai/whisper-large-v2",
        },
      },
    },
  };
