import { PromptSchema } from "../../utils/promptUtils";

export const HuggingFaceTextGenerationParserPromptSchema: PromptSchema = {
  // See https://github.com/huggingface/huggingface_hub/blob/a331e82aad1bc63038194611236db28fa013814c/src/huggingface_hub/inference/_client.py#L1206
  // for settings and https://huggingface.co/docs/api-inference/detailed_parameters for defaults.
  // The settings below are supported settings specified in the HuggingFaceTextGenerationParser
  // refine_chat_completion_params implementation.
  input: {
    type: "string",
  },
  model_settings: {
    type: "object",
    properties: {
      model: {
        type: "string",
      },
      temperature: {
        type: "number",
        minimum: 0,
        maximum: 100,
        description: `The temperature of the sampling operation. 
        1 means regular sampling, 0 means always take the highest score, 
        100.0 is getting closer to uniform probability.`,
      },
      top_k: {
        type: "integer",
        description: `Integer to define the top tokens considered within the sample operation to create new text.`,
      },
      top_p: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: `Float to define the tokens that are within the sample operation of text generation. 
        Add tokens in the sample for more probable to least probable until the sum of the probabilities 
        is greater than top_p.`,
      },
      details: {
        type: "boolean",
      },
      stream: {
        type: "boolean",
        default: true,
      },
      do_sample: {
        type: "boolean",
        description: `Whether or not to use sampling, use greedy decoding otherwise.`,
      },
      max_new_tokens: {
        type: "integer",
        description: `The amount of new tokens to be generated, this does not include the input length 
        it is a estimate of the size of generated text you want. Each new tokens slows down the request, 
        so look for balance between response times and length of text generated.`,
      },
      best_of: {
        type: "integer",
      },
      repetition_penalty: {
        type: "number",
        minimum: 0,
        maximum: 100,
        description: `The more a token is used within generation the more it is penalized to not be picked
         in successive generation passes.`,
      },
      return_full_text: {
        type: "boolean",
        description: `If set to False, the return results will not contain the original query making it easier for prompting.`,
      },
      seed: {
        type: "integer",
      },
      stop_sequences: {
        type: "array",
        items: {
          type: "string",
        },
      },
      truncate: {
        type: "integer",
      },
      typical_p: {
        type: "number",
      },
      watermark: {
        type: "boolean",
      },
    },
  },
};
