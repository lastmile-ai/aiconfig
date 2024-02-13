import { Button, Container, Flex, Modal, Text, Tooltip } from "@mantine/core";
import { memo, useContext, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import CopyButton from "../CopyButton";
import AIConfigContext from "../../contexts/AIConfigContext";

type Props = {
  onShare: () => Promise<string | void>;
};

export default memo(function ShareButton({ onShare }: Props) {
  const { mode } = useContext(AIConfigContext);
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
        onClick={onClick}
        size="xs"
        variant="filled"
      >
        Share {artifactName}
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
