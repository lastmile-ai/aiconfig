import { memo, useContext } from "react";
import type { Attachment as InputAttachment, JSONObject, AttachmentDataWithStringValue } from "aiconfig";
import { PromptInputObjectAttachmentsSchema } from "../../../../utils/promptUtils";
import { ActionIcon, Container, Flex, Tooltip } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import AttachmentMetadata from "./AttachmentMetadata";
import MimeTypeRenderer from "../../../MimeTypeRenderer";
import AIConfigContext from "../../../../contexts/AIConfigContext";

type Props = {
  schema: PromptInputObjectAttachmentsSchema;
  attachment: InputAttachment;
  onUpdateMetadata?: (metadata: JSONObject) => void;
  onRemoveAttachment?: () => void;
  onEditAttachment?: () => void;
};

export default memo(function AttachmentContainer({
  schema,
  attachment,
  onUpdateMetadata,
  onRemoveAttachment,
  onEditAttachment,
}: Props) {
  const {readOnly} = useContext(AIConfigContext);
  return (
    <Container display="flex">
      <Flex direction="column">
        {onEditAttachment && !readOnly && (
          <ActionIcon onClick={onEditAttachment}>
            <Tooltip label="Edit attachment">
              <IconEdit size={16} />
            </Tooltip>
          </ActionIcon>
        )}
        {onRemoveAttachment && !readOnly && (
          <ActionIcon onClick={onRemoveAttachment}>
            <Tooltip label="Remove attachment">
              <IconTrash size={16} color="red" />
            </Tooltip>
          </ActionIcon>
        )}
      </Flex>
      <MimeTypeRenderer
        mimeType={attachment.mime_type}
        content={(attachment.data as AttachmentDataWithStringValue).value as string}
      />
      {schema.items.properties?.metadata && (
        <AttachmentMetadata
          schema={schema.items.properties.metadata}
          attachment={attachment}
          onUpdateMetadata={onUpdateMetadata}
        />
      )}
    </Container>
  );
});
