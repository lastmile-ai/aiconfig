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
          mime_types: ["audio/mpeg", "audio/wav", "audio/webm"],
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
      chunk_length_s: {
        type: "number",
        description: `The input length for each chunk. If chunk_length_s = 0 then chunking is disabled (default).`,
      },
      stride_length_s: {
        type: "number",
        description: `The length of stride on the left and right of each chunk.
         Used only with chunk_length_s > 0. This enables the model to see more context and 
         infer letters better than without this context but the pipeline discards the stride 
         bits at the end to make the final reconstitution as perfect as possible.
         Defaults to defaults to chunk_length_s / 6`,
      },
      framework: {
        type: "string",
        enum: ["pt", "tf"],
        description: `The framework to use, either "pt" for PyTorch or "tf" for TensorFlow. 
        The specified framework must be installed. If no framework is specified, will 
        default to the one currently installed. If no framework is specified and both 
        frameworks are installed, will default to the framework of the model, or to PyTorch if 
        no model is provided.`,
      },
    },
  },
};
