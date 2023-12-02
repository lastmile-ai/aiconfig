import { OpenAIChatModelParserPromptSchema } from "@/src/shared/prompt_schemas/OpenAIChatModelParserPromptSchema";
import { PromptSchema } from "@/src/utils/promptUtils";

export const OpenAIChatVisionModelParserPromptSchema: PromptSchema = {
  ...OpenAIChatModelParserPromptSchema,
  input: {
    type: "object",
    properties: {
      required: ["data"],
      data: {
        type: "string",
      },
      // TODO: Figure out the best way to handle attachment data types. Not sure if we should follow the same
      // schema structure as for model settings and prompt metadata here...
      attachments: {
        type: "array",
        items: {
          type: "object",
          required: ["data"],
          properties: {
            data: {
              type: "string",
              enum: ["text/uri-list"],
            },
            mime_type: {
              type: "string",
              enum: ["image/png"],
            },
          },
        },
      },
    },
  },
};
