import { Button, Tooltip, createStyles } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { memo, useState } from "react";

type Props = {
  onDownload: () => Promise<void>;
  /**
   * If grouped, apply styles to the button with assumption that
   * the button is the leftmost in the group
   */
  isGrouped?: boolean;
};

const useStyles = createStyles(() => ({
  buttonGroupLeft: {
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0,
  },
}));

export default memo(function DownloadButton({
  onDownload,
  isGrouped = false,
}: Props) {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const { classes } = useStyles();

  const onClick = async () => {
    if (isDownloading) {
      return;
    }
    setIsDownloading(true);
    await onDownload();
    setIsDownloading(false);
  };

  return (
    <Tooltip label="Download config file">
      <Button
        loaderPosition="center"
        loading={isDownloading}
        loaderProps={{ size: "sm" }}
        onClick={onClick}
        size="xs"
        variant="filled"
        className={
          isGrouped ? `${classes.buttonGroupLeft} buttonGroupLeft` : undefined
        }
      >
        <IconDownload size="20px" />
      </Button>
    </Tooltip>
  );
});
