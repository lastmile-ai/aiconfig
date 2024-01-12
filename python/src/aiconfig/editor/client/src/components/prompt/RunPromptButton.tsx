import { Button, Flex, Loader, Tooltip } from "@mantine/core";
import { IconPlayerPlayFilled, IconPlayerStop } from "@tabler/icons-react";
import { memo } from "react";

type Props = {
  cancel: () => Promise<void>;
  enabled: boolean;
  runPrompt: () => Promise<void>;
  isRunning?: boolean;
};

export default memo(function RunPromptButton({
  cancel,
  enabled,
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
  const button = (
    <span>
      <Button
        onClick={onClick}
        disabled={!enabled}
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
    </span>
  );

  return enabled ? (
    { button }
  ) : (
    <Tooltip
      label="Can't run while another prompt is running :("
      offset={20}
      withArrow
    >
      {button}
    </Tooltip>
  );
});
