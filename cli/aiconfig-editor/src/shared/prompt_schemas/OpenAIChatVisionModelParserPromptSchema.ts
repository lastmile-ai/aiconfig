import { OpenAIChatModelParserPromptSchema } from "@/src/shared/prompt_schemas/OpenAIChatModelParserPromptSchema";
import { PromptSchema } from "@/src/utils/promptUtils";

export const OpenAIChatVisionModelParserPromptSchema: PromptSchema = {
  ...OpenAIChatModelParserPromptSchema,
  input: {
    type: "object",
    required: ["data"],
    properties: {
      data: {
        type: "string",
      },
      attachments: {
        type: "array",
        items: {
          type: "attachment",
          required: ["data"],
          mime_types: ["image/png"],
          properties: {
            data: {
              type: "string",
            },
          },
        },
      },
    },
  },
};
