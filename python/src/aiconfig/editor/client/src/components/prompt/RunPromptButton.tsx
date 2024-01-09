import { Button, Flex, Loader, Text } from "@mantine/core";
import { IconPlayerPlayFilled, IconPlayerStop } from "@tabler/icons-react";
import { memo } from "react";

type Props = {
  isRunning?: boolean;
  cancel: () => Promise<void>;
  runPrompt: () => Promise<void>;
  size: "compact" | "full";
};

export default memo(function RunPromptButton({
  cancel,
  runPrompt,
  size,
  isRunning = false,
}: Props) {
  const onClick = async () => {
    if (isRunning) {
      console.log("Cancelling execution...");
      return await cancel();
    } else {
      console.log("Running execution...");
      return await runPrompt();
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={false}
      p="xs"
      size="xs"
      fullWidth={size === "full"}
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
          {size === "full" && <Text ml="0.5em">Run</Text>}
        </>
      )}
    </Button>
  );
});
