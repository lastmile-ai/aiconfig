import { PromptSchema } from "../../utils/promptUtils";

export const ClaudeBedrockPromptSchema: PromptSchema = {
  // See https://docs.anthropic.com/claude/reference/complete_post
  // for settings and defaults. The settings below are supported settings specified in the ClaudeBedrockModelParser
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
      max_tokens_to_sample: {
        type: "integer",
        description: `The maximum number of tokens to generate before stopping.
        Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.`,
      },
      stop_sequences: {
        type: "array",
        items: {
          type: "string",
        },
        description: `Sequences that will cause the model to stop generating.`,
      },
      stream: {
        type: "boolean",
        default: true,
        description: `If true, send messages token by token. If false, messages send in bulk.`,
      },
      temperature: {
        type: "number",
        minimum: 0.0,
        maximum: 1.0,
        description: `Amount of randomness injected into the response.`,
      },
      top_p: {
        type: "number",
        minimum: 0.0,
        maximum: 1.0,
        description: `In nucleus sampling, we compute the cumulative distribution over all the options for each subsequent token in decreasing probability order and cut it off once it reaches a particular probability specified by top_p. 
        You should either alter temperature or top_p, but not both.`,
      },
      top_k: {
        type: "number",
        description: `Only sample from the top K options for each subsequent token.
        Used to remove "long tail" low probability responses.`,
      },
      metadata: {
        type: "object",
        properties: {
          user_id: {
            type: "string",
          },
        },
        description: `An object describing metadata about the request. (Claude specific)`,
      },
    },
    required: ["model", "max_tokens_to_sample", "stop_sequences"],
  },
};
