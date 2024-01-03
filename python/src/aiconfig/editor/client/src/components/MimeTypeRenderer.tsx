import { memo } from "react";
import { Image } from "@mantine/core";

type Props = {
  mimeType?: string;
  content: string;
};

export default memo(function MimeTypeRenderer({ mimeType, content }: Props) {
  const mimetype = (mimeType ?? "text/plain").split("/", 1)[0]; // MIME type without subtype
  switch (mimetype) {
    case "image":
      // TODO: Figure out base64 encoding
      return <Image alt="Attachment image" src={content} maw={300} />;
    default: // "text"
      return <span>{content}</span>;
  }
});
