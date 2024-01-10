import { PromptSchema } from "../../utils/promptUtils";

export const PaLMChatParserPromptSchema: PromptSchema = {
  // See https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/text-chat for settings
  // and defaults. The settings below are supported settings specified in the PaLMChatParser
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
      context: {
        type: "string",
        description: `Context shapes how the model responds throughout the conversation. 
        For example, you can use context to specify words the model can or cannot use, 
        topics to focus on or avoid, or the response format or style.`,
      },
      candidate_count: {
        type: "integer",
        minimum: 1,
        maximum: 4,
        description: "The number of response variations to return.",
      },
      temperature: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: `The temperature is used for sampling during response generation, 
        which occurs when topP and topK are applied. Temperature controls the degree of 
        randomness in token selection. Lower temperatures are good for prompts that require 
        a less open-ended or creative response, while higher temperatures can lead to more 
        diverse or creative results. A temperature of 0 means that the highest probability 
        tokens are always selected. In this case, responses for a given prompt are mostly 
        deterministic, but a small amount of variation is still possible.
        If the model returns a response that's too generic, too short, or the model gives 
        a fallback response, try increasing the temperature.`,
      },
      top_p: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: `Top-P changes how the model selects tokens for output. Tokens are selected from 
        the most (see top-K) to least probable until the sum of their probabilities equals the top-P value. 
        For example, if tokens A, B, and C have a probability of 0.3, 0.2, and 0.1 and the top-P value is 0.5, 
        then the model will select either A or B as the next token by using temperature and excludes C as a candidate.
        Specify a lower value for less random responses and a higher value for more random responses.`,
      },
      top_k: {
        type: "integer",
        minimum: 1,
        maximum: 40,
        description: `Top-K changes how the model selects tokens for output. A top-K of 1 means the next 
        selected token is the most probable among all tokens in the model's vocabulary (also called greedy decoding), 
        while a top-K of 3 means that the next token is selected from among the three most probable tokens 
        by using temperature.
        For each token selection step, the top-K tokens with the highest probabilities are sampled. 
        Then tokens are further filtered based on top-P with the final token selected using temperature sampling.
        Specify a lower value for less random responses and a higher value for more random responses.`,
      },
      examples: {
        type: "array",
        items: {
          type: "object",
          required: ["input", "output"],
          properties: {
            input: {
              type: "string",
            },
            output: {
              type: "string",
            },
          },
        },
        description: `Examples for the model to learn how to respond to the conversation.`,
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
