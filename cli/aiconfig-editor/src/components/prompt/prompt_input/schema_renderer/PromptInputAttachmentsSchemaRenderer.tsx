import { PromptInputObjectAttachmentsSchema } from "@/src/utils/promptUtils";
import { JSONValue } from "aiconfig/dist/common";
import { memo } from "react";

type Props = {
  schema: PromptInputObjectAttachmentsSchema;
  onChangeAttachments: (value: JSONValue) => void;
};

export default memo(function PromptInputAttachmentsSchemaRenderer(
  props: Props
) {
  return "ATTACHMENTS SCHEMA RENDERER";
});
