import { Button, createStyles, Flex, Text } from "@mantine/core";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { memo } from "react";

type Props = {
  runPrompt: () => Promise<void>;
  size: "compact" | "full";
};

const useStyles = createStyles(() => ({
  executeButton: {
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
}));

export default memo(function RunPromptButton({ runPrompt, size }: Props) {
  const { classes } = useStyles();
  return (
    <Button
      onClick={runPrompt}
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
