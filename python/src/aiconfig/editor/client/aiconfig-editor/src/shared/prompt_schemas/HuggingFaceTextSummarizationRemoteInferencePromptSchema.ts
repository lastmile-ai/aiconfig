import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceTextSummarizationRemoteInferencePromptSchema: PromptSchema =
  {
    // See https://huggingface.co/docs/api-inference/detailed_parameters#summarization-task for supported params.
    // The settings below are supported settings specified in the HuggingFaceTextSummarizationRemoteInference
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
          default: "facebook/bart-large-cnn",
        },
        min_length: {
          type: "integer",
          description: `Integer to define the minimum length in tokens of the output summary.`,
        },
        max_length: {
          type: "integer",
          description: `Integer to define the maximum length in tokens of the output summary.`,
        },
        top_k: {
          type: "integer",
          description: `Integer to define the top tokens considered within the sample operation to create new text.`,
        },
        top_p: {
          type: "number",
          description: `Float to define the tokens that are within the sample operation of text generation. 
        Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.`,
        },
        temperature: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: `The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 
        100.0 is getting closer to uniform probability.`,
        },
        repetition_penalty: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: `The more a token is used within generation the more it is penalized to not be picked in successive generation passes.`,
        },
        max_time: {
          type: "number",
          minimum: 0,
          maximum: 120,
          description: `The amount of time in seconds that the query should take maximum. 
        Network can cause some overhead so it will be a soft limit.`,
        },
        use_cache: {
          type: "boolean",
          description: `There is a cache layer on the inference API to speedup requests we have already seen. 
        Most models can use those results as is as models are deterministic (meaning the results will be the same anyway). 
        However if you use a non deterministic model, you can set this parameter to prevent the caching mechanism from being used 
        resulting in a real new query.`,
        },
        wait_for_model: {
          type: "boolean",
          description: `If the model is not ready, wait for it instead of receiving 503. 
        It limits the number of requests required to get your inference done. 
        It is advised to only set this flag to true after receiving a 503 error as it will limit hanging in your application to known places.`,
        },
      },
    },
  };
