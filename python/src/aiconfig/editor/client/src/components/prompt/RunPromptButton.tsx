import { Button, Flex, Loader } from "@mantine/core";
import { IconPlayerPlayFilled, IconPlayerStop } from "@tabler/icons-react";
import { memo } from "react";

type Props = {
  isRunning?: boolean;
  cancel: () => Promise<void>;
  runPrompt: () => Promise<void>;
};

export default memo(function RunPromptButton({
  cancel,
  runPrompt,
  isRunning = false,
}: Props) {
  const onClick = async () => {
    if (isRunning) {
      return await cancel();
    } else {
      return await runPrompt();
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={false}
      p="xs"
      size="xs"
      className="runPromptButton"
    >
      {isRunning ? (
        <Flex align="center" justify="center">
          <Loader style={{ position: "absolute" }} size="xs" color="white" />
          <IconPlayerStop fill="white" size={14} />
        </Flex>
      ) : (
        <>
          <IconPlayerPlayFilled size="16" />
        </>
      )}
    </Button>
  );
});
