import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceConversationalRemoteInferencePromptSchema: PromptSchema = {
  // See API Ref: https://github.com/huggingface/huggingface_hub/blob/main/src/huggingface_hub/inference/_client.py#L338
  // See Docs ref: https://huggingface.co/docs/huggingface_hub/package_reference/inference_client#huggingface_hub.InferenceClient.conversational
  // for supported params.
  // The settings below are supported settings specified in the HuggingFaceConversationalRemoteInference
  // refine_completion_params implementation.
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
        default: "facebook/blenderbot-400M-distill",
      },
    },
  },
};
