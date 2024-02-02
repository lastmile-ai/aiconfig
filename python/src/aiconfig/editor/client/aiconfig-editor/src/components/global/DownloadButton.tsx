import { Button } from "@mantine/core";
import { memo, useState } from "react";

type Props = {
  onDownload: () => Promise<void>;
};

export default memo(function DownloadButton({ onDownload }: Props) {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const onClick = async () => {
    if (isDownloading) {
      return;
    }
    setIsDownloading(true);
    await onDownload();
    setIsDownloading(false);
  };

  return (
    <Button
      loaderPosition="center"
      loading={isDownloading}
      onClick={onClick}
      size="xs"
      variant="filled"
    >
      Download
    </Button>
  );
});
