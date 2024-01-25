import { memo, useContext, useState } from "react";
import type { Attachment, Attachment as InputAttachment } from "aiconfig";
import { ActionIcon, Container, Text, Title, Tooltip } from "@mantine/core";
import { Dropzone, FileRejection } from "@mantine/dropzone";
import { IconX } from "@tabler/icons-react";
import AIConfigContext from "../../../../contexts/AIConfigContext";
import {
  UploadState,
  getDropzoneUploadErrorMessage,
} from "../../../../utils/dropzoneHelpers";
import { PromptInputObjectAttachmentsSchema } from "../../../../utils/promptUtils";
import { uploadFileToS3 } from "../../../../utils/uploadFileToS3";

type Props = {
  schema: PromptInputObjectAttachmentsSchema;
  onUploadAttachments: (attachments: InputAttachment[]) => void;
  onCancel?: () => void;
};

function getSupportedFileTypes(schema: PromptInputObjectAttachmentsSchema) {
  return schema.items.mime_types.join(", ");
}

export default memo(function AttachmentUploader({
  schema,
  onUploadAttachments,
  onCancel,
}: // TODO: Handle max files, taking into account existing attachments
Props) {
  const [fileList, setFileList] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { readOnly } = useContext(AIConfigContext);

  const onDropzoneClick = async (files: File[]) => {
    if (uploadState === "dropzone_error") {
      // button should be disabled anyway, but just in case
      return;
    }
    let uploads: { url: string; mimeType: string }[] = [];

    try {
      if (files.length > 0) {
        setUploadState("uploading");
        uploads = await Promise.all(
          files.map(async (file: File) => {
            const upload = await uploadFileToS3(file);
            return {
              url: upload.url,
              mimeType: file.type,
            };
          })
        );
      }

      const uploadedFileUrl = uploads[0]?.url;
      if (!uploadedFileUrl) {
        throw new Error("Error uploading file");
      }
      setUploadState("success");

      const attachments: Attachment[] = uploads.map((upload) => {
        return {
          data: { value: upload.url, kind: "file_uri" },
          mime_type: upload.mimeType,
        };
      });

      onUploadAttachments(attachments);
    } catch (error) {
      setUploadState("upload_error");
      const errorMessage =
        error instanceof Error ? error.message : "Error uploading file";
      setUploadError(errorMessage);
    }
  };

  const maxFileSize = schema.items.max_size;

  return (
    <div>
      {(uploadState === "upload_error" || uploadState === "dropzone_error") &&
        uploadError && (
          <Text size="xs" color="red">
            {uploadError}
          </Text>
        )}
      <Container display="flex">
        {onCancel && (
          <ActionIcon onClick={onCancel}>
            <Tooltip label="Cancel">
              <IconX size={16} />
            </Tooltip>
          </ActionIcon>
        )}
        <Dropzone
          multiple={true}
          onDrop={(files: File[]) => {
            setUploadState("idle");
            setFileList(files);
            onDropzoneClick(files);
          }}
          onReject={(fileRejections: FileRejection[]) => {
            setUploadState("dropzone_error");
            const fileName = fileRejections?.[0]?.file?.name;
            const error = fileRejections?.[0]?.errors?.[0];
            setUploadError(getDropzoneUploadErrorMessage(error, fileName));
          }}
          // TODO: Get these from schema,
          // maxSize={MAX_IMAGE_FILE_SIZE}
          accept={schema.items.mime_types}
          disabled={readOnly}
        >
          {fileList.length > 0 ? (
            `${fileList.length} File(s) Uploading...`
          ) : (
            <div>
              <Title order={4}>Upload File</Title>
              <Text fz="sm" c="dimmed">
                Supported files: {getSupportedFileTypes(schema)}
              </Text>
              {maxFileSize && (
                <Text fz="sm" c="dimmed">
                  Max file size: {maxFileSize}MB
                </Text>
              )}
            </div>
          )}
        </Dropzone>
      </Container>
    </div>
  );
});
