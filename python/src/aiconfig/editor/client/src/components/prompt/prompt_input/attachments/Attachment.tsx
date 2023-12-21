import { memo } from "react";
import type { Attachment as InputAttachment } from "aiconfig";
import { Image } from "@mantine/core";

type Props = {
  attachment: InputAttachment;
};

export default memo(function Attachment({ attachment }: Props) {
  const mimetype = (attachment.mime_type ?? "text/plain").split("/", 1)[0]; // MIME type without subtype
  switch (mimetype) {
    case "image":
      // TODO: Figure out base64 encoding
      return <Image alt="Attachment image" src={attachment.data as string} />;
    default: // "text"
      return <span>{attachment.data as string}</span>;
  }
});
