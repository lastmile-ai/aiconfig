import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceText2SpeechRemoteInferencePromptSchema: PromptSchema = {
  // See https://github.com/huggingface/huggingface_hub/blob/main/src/huggingface_hub/inference/_client.py#L1624 for supported params.
  // The settings below are supported settings specified in the HuggingFaceText2SpeechRemoteInference refine_completion_params implementation.
  input: {
    type: "string",
  },
  model_settings: {
    type: "object",
    properties: {
      model: {
        type: "string",
        description: `Hugging Face model to use. Can be a model ID hosted on the Hugging Face Hub or a URL 
        to a deployed Inference Endpoint`,
        default: "facebook/fastspeech2-en-ljspeech",
      },
    },
  },
};
