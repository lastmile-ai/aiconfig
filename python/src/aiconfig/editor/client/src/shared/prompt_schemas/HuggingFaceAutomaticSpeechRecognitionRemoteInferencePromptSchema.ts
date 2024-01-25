import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceAutomaticSpeechRecognitionPromptSchema: PromptSchema = {
  // See https://huggingface.co/docs/transformers/v4.36.1/en/main_classes/pipelines#transformers.AutomaticSpeechRecognitionPipeline
  // for descriptions.

  // The following supported properties cannot be cleanly modeled in the schema and must be implemented programatically:
  // tokenizer, feature_extractor, device, decoder
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
        description: `Hugging Face model to use`,
      },
    },
  },
};
