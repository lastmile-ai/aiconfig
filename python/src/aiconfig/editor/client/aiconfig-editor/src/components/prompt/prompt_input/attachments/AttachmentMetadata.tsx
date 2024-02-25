import { memo } from "react";
import type { Attachment as InputAttachment, JSONObject } from "aiconfig";
import { GenericPropertiesSchema } from "../../../../utils/promptUtils";
// import { useSchemaState } from "../../../../hooks/useSchemaState";

type Props = {
  schema: GenericPropertiesSchema;
  attachment: InputAttachment;
  onUpdateMetadata?: (metadata: JSONObject) => void;
};

export default memo(function AttachmentMetadata(_props: Props) {
  // const metadataState = useSchemaState(schema, attachment.metadata);
  // TODO: Implement similar to ModelSettingsSchemaRenderer. Can probably generalize to one component
  // which properly updates the right aiconfig properties based on callback function
  return null;
});
