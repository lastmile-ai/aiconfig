import { Button, Flex, Loader, Tooltip } from "@mantine/core";
import { IconPlayerPlayFilled, IconPlayerStop } from "@tabler/icons-react";
import { memo, useContext, useState } from "react";
import AIConfigContext from "../../contexts/AIConfigContext";

type Props = {
  onShare: () => Promise<string | void>;
};

export default memo(function ShareButton({ onShare }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onClick = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    const shareUrl: string | void = await onShare();
    setIsLoading(false);

    if (!shareUrl) {
      return;
    }

    console.log("Share URL: ", shareUrl);
  };

  const button = (
    <Button
      loaderPosition="center"
      loading={isLoading}
      onClick={onClick}
      p="xs"
      size="xs"
      variant="filled"
    >
      Share
    </Button>
  );

  const tooltipMessage: string = isLoading
    ? "Generating share link..."
    : "Create a link to share your AIConfig!";
  return (
    <Tooltip label={tooltipMessage} withArrow>
      <div>{button}</div>
    </Tooltip>
  );
});
