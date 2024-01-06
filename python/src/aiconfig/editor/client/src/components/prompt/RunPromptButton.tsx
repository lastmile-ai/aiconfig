import { Button, Flex, Loader, Text } from "@mantine/core";
import { IconPlayerPlayFilled, IconPlayerStop } from "@tabler/icons-react";
import { memo } from "react";

type Props = {
  isRunning?: boolean;
  runPrompt: () => Promise<void>;
  size: "compact" | "full";
};

export default memo(function RunPromptButton({
  runPrompt,
  size,
  isRunning = false,
}: Props) {
  return (
    <Button
      onClick={runPrompt}
      disabled={isRunning}
      p="xs"
      size="xs"
      fullWidth={size === "full"}
      className="runPromptButton"
    >
      {isRunning ? (
        <Flex align="center" justify="center">
          <Loader
            style={{ position: "absolute", margin: "0 auto" }}
            size="xs"
            color="white"
          />
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
