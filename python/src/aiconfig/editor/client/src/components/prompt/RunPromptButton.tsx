import { Button, Flex, Loader, Tooltip } from "@mantine/core";
import { IconPlayerPlayFilled, IconPlayerStop } from "@tabler/icons-react";
import { memo, useCallback, useContext, useMemo } from "react";
import AIConfigContext from "../../contexts/AIConfigContext";

type Props = {
  cancel: () => Promise<void>;
  runPrompt: () => Promise<void>;
  isRunning?: boolean;
  disabled?: boolean;
};

export default memo(function RunPromptButton({
  cancel,
  runPrompt,
  isRunning = false,
  disabled = false,
}: Props) {
  const { readOnly } = useContext(AIConfigContext);
  const disabledOrReadOnly = disabled || readOnly;

  const onClick = useCallback(async () => {
    if (isRunning) {
      return await cancel();
    } else {
      return await runPrompt();
    }
  }, [cancel, runPrompt, isRunning]);

  const button = useMemo(() => {
    return (
      <Button
        onClick={onClick}
        disabled={disabledOrReadOnly}
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
  }, [disabledOrReadOnly, onClick, isRunning]);

  const disabledButton = useMemo(() => {
    return readOnly ? (
      button
    ) : (
      <Tooltip label={"Can't run while another prompt is running"} withArrow>
        <div>{button}</div>
      </Tooltip>
    );
  }, [button, readOnly]);

  return disabledOrReadOnly ? disabledButton : button;
});
