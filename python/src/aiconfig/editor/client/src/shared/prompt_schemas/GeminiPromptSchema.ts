import { PromptSchema } from "../../utils/promptUtils";
// This does not support Gemini Vision. Model parser does not support it.

export const GeminiParserPromptSchema: PromptSchema = {
  // https://platform.openai.com/docs/api-reference/chat/create
  input: {
    type: "string",
  },
  model_settings: {
    type: "object",
    properties: {
      "generation_config":{
        type: "object",
      },
      "safety_settings":{
        type: "object"
      },
      "stream":{
        type: "boolean",
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
