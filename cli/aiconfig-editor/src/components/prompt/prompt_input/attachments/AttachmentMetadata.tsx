import { memo } from "react";
import type { Attachment as InputAttachment } from "aiconfig";
import {
  GenericPropertiesSchema,
  PromptInputObjectAttachmentsSchema,
} from "@/src/utils/promptUtils";
import { useSchemaState } from "@/src/hooks/useSchemaState";

type Props = {
  schema: GenericPropertiesSchema;
  attachment: InputAttachment;
  onUpdateMetadata?: (metadata: { [k: string]: any }) => void;
};

export default memo(function AttachmentMetadata({
  schema,
  attachment,
  onUpdateMetadata,
}: Props) {
  const metadataState = useSchemaState(schema, attachment.metadata);
  // TODO: Implement similar to ModelSettingsSchemaRenderer. Can probably generalize to one component
  // which properly updates the right aiconfig properties based on callback function
  return null;
});
