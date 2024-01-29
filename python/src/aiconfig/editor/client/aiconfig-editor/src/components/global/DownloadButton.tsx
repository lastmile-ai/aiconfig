import { Button } from "@mantine/core";
import { AIConfig } from "aiconfig";
import { memo, useContext, useState } from "react";
import AIConfigContext from "../../contexts/AIConfigContext";
import { clientConfigToAIConfig } from "../../shared/types";

type Props = {
  onDownload: (config: AIConfig) => Promise<void>;
};

export default memo(function DownloadButton({ onDownload }: Props) {
  const { getState } = useContext(AIConfigContext);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const onClick = async () => {
    if (isDownloading) {
      return;
    }
    setIsDownloading(true);
    const config: AIConfig = clientConfigToAIConfig(getState());
    await onDownload(config);
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
