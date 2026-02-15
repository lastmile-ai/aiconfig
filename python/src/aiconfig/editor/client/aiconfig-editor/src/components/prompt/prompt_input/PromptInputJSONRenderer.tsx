import { JSONValue, PromptInput } from "aiconfig";
import { memo, useCallback } from "react";
import JSONRenderer from "../../JSONRenderer";

type Props = {
  input: PromptInput;
  onChangeInput: (value: PromptInput) => void;
};

const PROMPT_INPUT_SCHEMA = {
  anyOf: [
    {
      type: "object",
      additionalProperties: {},
      properties: {
        data: {
          description:
            "Input to the model. This can represent a single input, or multiple inputs.\nThe structure of the data object is up to the ModelParser. Attachments field should be leveraged for non-text inputs (e.g. image, audio).",
        },
        attachments: {
          description:
            "Used to include non-text inputs (e.g. image, audio) of specified MIME types in the prompt",
          type: "array",
          items: {
            $ref: "#/definitions/Attachment",
          },
        },
      },
    },
    {
      type: "string",
    },
  ],
  definitions: {
    Attachment: {
      description: "Data of specified MIME type to attach to a prompt",
      type: "object",
      required: ["data"],
      properties: {
        mime_type: {
          description:
            "MIME type of the attachment. If not specified, the MIME type will be assumed to be text/plain.",
          type: "string",
        },
        data: {
          description: "Data representing the attachment",
        },
        metadata: {
          description: "Attachment metadata.",
          type: "object",
          additionalProperties: {},
        },
      },
    },
  },
};

export default memo(function PromptInputJSONRenderer({
  input,
  onChangeInput,
}: Props) {
  const onChange = useCallback(
    (value: JSONValue) => {
      onChangeInput(value as PromptInput);
    },
    [onChangeInput]
  );

  return (
    <JSONRenderer
      content={input}
      onChange={onChange}
      schema={PROMPT_INPUT_SCHEMA}
    />
  );
});
