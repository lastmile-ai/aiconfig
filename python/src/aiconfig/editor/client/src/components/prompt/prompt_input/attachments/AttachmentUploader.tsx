import { memo, useState } from "react";
import type { Attachment, Attachment as InputAttachment } from "aiconfig";
import { PromptInputObjectAttachmentsSchema } from "../../../../utils/promptUtils";
import { Dropzone, FileRejection } from "@mantine/dropzone";
import {
  UploadState,
  getDropzoneUploadErrorMessage,
} from "../../../../utils/dropzoneHelpers";
import { ActionIcon, Container, Text, Title, Tooltip } from "@mantine/core";
import { IconX } from "@tabler/icons-react";

type Props = {
  schema: PromptInputObjectAttachmentsSchema;
  onUploadAttachments: (attachments: InputAttachment[]) => void;
  onCancel?: () => void;
};

async function uploadFile(_file: File) {
  // TODO: Implement
  return {
    url: "https://s3.amazonaws.com/files.uploads.lastmileai.com/uploads/cldxsqbel0000qs8owp8mkd0z/2023_12_1_21_23_24/942/Screenshot 2023-11-28 at 11.11.25 AM.png",
  };
}

function getSupportedFileTypes(schema: PromptInputObjectAttachmentsSchema) {
  return schema.items.mime_types;
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
            const upload = await uploadFile(file);
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
          data: upload.url,
          mimeType: upload.mimeType,
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
          // accept={}
        >
          {fileList.length > 0 ? (
            `${fileList.length} File(s) to Upload`
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
