import {
  Button,
  Container,
  Flex,
  Modal,
  Text,
  Tooltip,
  createStyles,
} from "@mantine/core";
import { memo, useContext, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import CopyButton from "../CopyButton";
import AIConfigContext from "../../contexts/AIConfigContext";
import { IconShare } from "@tabler/icons-react";

type Props = {
  onShare: () => Promise<string | void>;
  /**
   * If grouped, apply styles to the button with assumption that
   * the button is the rightmost in the group
   */
  isGrouped?: boolean;
};

const useStyles = createStyles(() => ({
  buttonGroupRight: {
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
  },
}));

export default memo(function ShareButton({
  onShare,
  isGrouped = false,
}: Props) {
  const { mode } = useContext(AIConfigContext);
  const [isModalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const { classes } = useStyles();

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

  // We use 'Notebook' in Gradio for GradioNotebook packaging
  const artifactName = mode === "gradio" ? "Notebook" : "Workbook";

  const tooltipMessage: string = isLoading
    ? "Generating share link..."
    : `Create a link to share your ${artifactName}!`;
  const button = (
    <Tooltip label={tooltipMessage} withArrow>
      <Button
        loaderPosition="center"
        loading={isLoading}
        loaderProps={{ size: "sm" }}
        onClick={onClick}
        size="xs"
        variant="filled"
        className={
          isGrouped ? `${classes.buttonGroupRight} buttonGroupRight` : undefined
        }
      >
        <IconShare size="20px" />
      </Button>
    </Tooltip>
  );

  return (
    <>
      <Modal
        opened={isModalOpened}
        onClose={closeModal}
        title={`${artifactName} URL`}
      >
        <Container p={0} mr={-8}>
          <Flex direction="row">
            <Text truncate>{shareUrl}</Text>
            <CopyButton value={shareUrl} contentLabel={`${artifactName} URL`} />
          </Flex>
        </Container>
      </Modal>
      {button}
    </>
  );
});
