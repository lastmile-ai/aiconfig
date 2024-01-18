import { PromptInputObjectAttachmentsSchema } from "../../../../utils/promptUtils";
import type { Attachment as InputAttachment, JSONObject } from "aiconfig";
import { memo, useContext, useState } from "react";
import AttachmentContainer from "../attachments/AttachmentContainer";
import AttachmentUploader from "../attachments/AttachmentUploader";
import { Container } from "@mantine/core";
import AIConfigContext from "../../../../contexts/AIConfigContext";

type Props = {
  schema: PromptInputObjectAttachmentsSchema;
  onChangeAttachments: (value: InputAttachment[]) => void;
  attachments?: InputAttachment[];
};

function EditableAttachmentRenderer({
  schema,
  attachment,
  onUpdateAttachment,
  onAddAttachments,
  onRemoveAttachment,
}: {
  schema: PromptInputObjectAttachmentsSchema;
  attachment?: InputAttachment;
  onUpdateAttachment: (attachment: InputAttachment) => void;
  onAddAttachments: (value: InputAttachment[]) => void;
  onRemoveAttachment?: () => void;
}) {
  const [showUploader, setShowUploader] = useState(attachment?.data == null);
  const {readOnly} = useContext(AIConfigContext);

  return (
    <Container m="xs">
      {attachment && !showUploader ? (
        <AttachmentContainer
          attachment={attachment}
          schema={schema}
          onUpdateMetadata={(metadata: JSONObject) =>
            onUpdateAttachment({ ...attachment, metadata })
          }
          onRemoveAttachment={onRemoveAttachment}
          onEditAttachment={() => setShowUploader(true)}
        />
        // add comment here on if this should be readOnly or something else.
      ) : !readOnly && (
        <AttachmentUploader
          schema={schema}
          onUploadAttachments={(attachments: InputAttachment[]) => {
            onAddAttachments(attachments);
            setShowUploader(false);
          }}
          // Can only cancel if there is already an attachment to toggle back to
          onCancel={!attachment ? undefined : () => setShowUploader(false)}
        />
      )}
    </Container>
  );
}

export default memo(function PromptInputAttachmentsSchemaRenderer({
  schema,
  onChangeAttachments,
  attachments = [],
}: Props) {
  const onUpdateAttachment = (attachment: InputAttachment, index: number) => {
    const newAttachments = [...attachments];
    newAttachments[index] = attachment;
    onChangeAttachments(newAttachments);
  };

  const onAddAttachments = (
    addedAttachments: InputAttachment[],
    index: number
  ) => {
    let updatedAttachments;

    // Add to end of attachments
    if (index > attachments.length) {
      updatedAttachments = [...attachments, ...addedAttachments];
    } else {
      updatedAttachments = attachments.reduce((acc, attachment, i) => {
        if (i === index) {
          // Replace the attachment at the given index with the new attachments
          return [...acc, ...addedAttachments];
        }
        return [...acc, attachment];
      }, [] as InputAttachment[]);
    }

    onChangeAttachments(updatedAttachments);
  };

  const onRemoveAttachment = (index: number) => {
    const newAttachments = [
      ...attachments.slice(0, index),
      ...attachments.slice(index + 1),
    ];
    onChangeAttachments(newAttachments);
  };

  const numAttachments = attachments.length;

  return (
    <>
      {attachments.map((attachment, i) => (
        <EditableAttachmentRenderer
          key={`${JSON.stringify(attachment.data)}-${i}`}
          attachment={attachment}
          schema={schema}
          onUpdateAttachment={(attachment) => onUpdateAttachment(attachment, i)}
          onAddAttachments={(addedAttachments) =>
            onAddAttachments(addedAttachments, i)
          }
          onRemoveAttachment={() => onRemoveAttachment(i)}
        />
      ))}

      {/* If the schema supports more attachments, add another attachment input below existing attachments. This
       * will allow the user to add more attachments without 'clearing' existing ones.
       */}
      {(schema.max_items == null || numAttachments < schema.max_items) && (
        <EditableAttachmentRenderer
          // Use key to force re-mount if a new attachment is 'attached' (will render above as a result)
          // So that this 'new' attachment input is mounted with fresh state
          key={numAttachments}
          schema={schema}
          onUpdateAttachment={(attachment) =>
            onUpdateAttachment(attachment, numAttachments + 1)
          }
          onAddAttachments={(addedAttachments) =>
            onAddAttachments(addedAttachments, numAttachments + 1)
          }
        />
      )}
    </>
  );
});
