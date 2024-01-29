import { Button } from "@mantine/core";
import { memo, useState } from "react";

type Props = {
  onDownload: () => Promise<string | void>;
};

export default memo(function ShareButton({ onDownload }: Props) {
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
      p="xs"
      size="xs"
      variant="filled"
    >
      Download
    </Button>
  );
});
