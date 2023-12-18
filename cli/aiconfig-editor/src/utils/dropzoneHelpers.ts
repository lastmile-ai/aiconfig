export type UploadState =
  | "idle"
  | "dropzone_error"
  | "uploading"
  | "upload_error"
  | "success";

export function getDropzoneUploadErrorMessage(
  error?: {
    code?: string;
    message?: string;
  },
  fileName?: string
) {
  let errorMessage = `Failed to upload file${fileName ? ` ${fileName}` : ""}`;
  if (error?.code === "file-too-large") {
    errorMessage += ": File too large. Please upload a smaller file"; // TODO: Can we specify file size limits for attachments?
  } else if (error?.message) {
    errorMessage += `: ${error.message}`;
  }

  return errorMessage;
}
