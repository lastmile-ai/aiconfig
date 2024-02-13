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
      parameters: {
        type: "object",
        description: "Additional parameters for the conversational task.",
        properties: {
          min_length: {
            type: "integer",
            description: "Integer to define the minimum length in tokens of the output summary..",
          },
          max_length: {
            type: "integer",
            description: "Integer to define the maximum length in tokens of the output summary."
          },
          top_k: {
            type: "integer",
            description: "Integer to define the top tokens considered within the sample operation to create new text."
          },
          top_p: {
            type: "number",
            description: "Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p."
          },
          temperature: {
            type: "number",
            description: "The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.",
            minimum: 0,
            maximum: 100,
          },
          repetition_penalty: {
            type: "number",
            description: "The more a token is used within generation the more it is penalized to not be picked in successive generation passes.",
            minimum: 0,
            maximum: 100
          },
          max_time: {
            type: "number",
            description: "The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit.",
            minimum: 0,
            maximum: 120,
          }
        }
      }
    },
  },
};
