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

// s3 file uris cannot have '+' character, so replace with '_'
function sanitizeFileName(name: string) {
  return name.replace(/[_+]/g, "_");
}

export function getTodayDateString(): string {
  const date = new Date();
  const dateString = `${date.getFullYear()}_${
    date.getMonth() + 1
  }_${date.getDate()}`;
  const timeString = `${date.getUTCHours()}_${date.getUTCMinutes()}_${date.getUTCSeconds()}`;
  return `${dateString}_${timeString}`;
}

// TODO: Make this configurable for external deployments
async function uploadFile(file: File): Promise<{ url: string }> {
  const randomPath = Math.round(Math.random() * 10000);
  // TODO: Add back once CORS is resolved
  // const policyResponse = await fetch(
  //   "https://lastmileai.dev/api/upload/publicpolicy"
  // );
  // const policy = await policyResponse.json();
  const uploadUrl = "https://s3.amazonaws.com/lastmileai.aiconfig.public/";
  const uploadKey = `uploads/${getTodayDateString()}/${randomPath}/${sanitizeFileName(
    file.name
  )}`;

  const formData = new FormData();
  formData.append("key", uploadKey);
  formData.append("acl", "public-read");
  formData.append("Content-Type", file.type);
  // formData.append("AWSAccessKeyId", policy.AWSAccessKeyId);
  formData.append("success_action_status", "201");
  // formData.append("Policy", policy.s3Policy);
  // formData.append("Signature", policy.s3Signature);
  formData.append("file", file);

  // See this about changing to use XMLHTTPRequest to show upload progress as well
  // https://medium.com/@cpatarun/tracking-file-upload-progress-to-amazon-s3-from-the-browser-71be6712c63d
  const rawRes = await fetch(uploadUrl, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    body: formData,
    headers: {
      Authorization: "",
    },
  });

  if (rawRes.ok && rawRes.status === 201) {
    // Dont really need to parse xml s3 response, just use the keys, etc. that were passed
    return { url: `${uploadUrl}${uploadKey}` };
  } else {
    throw new Error("Error uploading to S3!");
  }
}

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
          data: {value: upload.url, kind: "file_uri"},
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
