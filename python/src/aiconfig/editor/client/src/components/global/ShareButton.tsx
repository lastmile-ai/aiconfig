import { Button, Modal, Tooltip, createStyles, rem } from "@mantine/core";
import { memo, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import CopyButton from "../CopyButton";

type Props = {
  onShare: () => Promise<string | void>;
};

const useStyles = createStyles((theme) => ({
  copyIcon: {
    alignItems: "flex-end",
    align: "right",
    justifyContent: "flex-end",
    position: "absolute",
    right: 0,
  },
  urlContainer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    align: "center",
    [theme.fn.smallerThan("sm")]: {
      marginLeft: "0",
      display: "block",
      position: "static",
      bottom: -10,
      left: 0,
      height: 28,
      margin: "10px 0",
    },
  },
}));

export default memo(function ShareButton({ onShare }: Props) {
  const { classes } = useStyles();
  const [isModalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>("");

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
    setShareUrl(shareUrl);
    openModal();
  };

  const tooltipMessage: string = isLoading
    ? "Generating share link..."
    : "Create a link to share your AIConfig!";
  const button = (
    <Tooltip label={tooltipMessage} withArrow>
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
    </Tooltip>
  );

  return (
    <>
      <Modal opened={isModalOpened} onClose={closeModal} title="AIConfig URL">
        <div className={classes.urlContainer}>
          {shareUrl}
          <div className={classes.copyIcon}>
            <CopyButton value={shareUrl} contentLabel="AIConfig URL" />
          </div>
        </div>
      </Modal>
      {button}
    </>
  );
});
