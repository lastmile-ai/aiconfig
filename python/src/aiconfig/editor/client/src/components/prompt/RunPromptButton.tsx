import { ClientPrompt } from "../../shared/types";
import { Button, createStyles, Flex, Text } from "@mantine/core";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { memo } from "react";

type Props = {
  prompt: ClientPrompt;
  size: "compact" | "full";
};

const useStyles = createStyles(() => ({
  executeButton: {
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
}));

export default memo(function RunPromptButton({ prompt, size }: Props) {
  const { classes } = useStyles();
  return (
    <Button
      onClick={() => {}}
      p="xs"
      size="xs"
      fullWidth={size === "full"}
      className={classes.executeButton}
    >
      <IconPlayerPlayFilled size="16" />
      {size === "full" && <Text ml="0.5em">Run</Text>}
    </Button>
  );
});
