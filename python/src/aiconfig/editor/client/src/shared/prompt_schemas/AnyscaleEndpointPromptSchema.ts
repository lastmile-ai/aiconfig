import { PromptSchema } from "../../utils/promptUtils";

export const AnyscaleEndpointPromptSchema: PromptSchema = {
  // See https://docs.anyscale.com/endpoints/model-serving/openai-migration-guide#step-3-check-parameter-compatibility
  // for settings and defaults. The settings below are supported settings specified in the OpenAIInference
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
      frequency_penalty: {
        type: "number",
        minimum: -2.0,
        maximum: 2.0,
        description: `Number between -2.0 and 2.0. 
        Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.`,
      },
      max_tokens: {
        type: "integer",
        description: `The maximum number of tokens to generate in the chat completion.`,
      },
      presence_penalty: {
        type: "number",
        minimum: -2.0,
        maximum: 2.0,
        description: `Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, 
        increasing the model's likelihood to talk about new topics.`,
      },
      stop: {
        type: "array",
        items: {
          type: "string",
        },
        description: `Up to 4 sequences where the API will stop generating further tokens. The returned text will not contain the stop sequence.`,
      },
      stream: {
        type: "boolean",
        description: `If true, send messages token by token. If false, messages send in bulk.`,
      },
      temperature: {
        type: "number",
        minimum: 0.0,
        maximum: 2.0,
        description: `A number between 0 and 2. Higher values correspond to more random responses and lower values being more deterministic.`,
      },
      top_p: {
        type: "number",
        minimum: 0.0,
        maximum: 1.0,
        description: `The percentage of tokens with top_p probability mass to consider. 
        For example, 0.1 means only tokens comprising the top 10% probability mass become candidates.`,
      },
    },
  },
  prompt_metadata: {
    type: "object",
    properties: {
      remember_chat_context: {
        type: "boolean",
      },
    },
  },
};
