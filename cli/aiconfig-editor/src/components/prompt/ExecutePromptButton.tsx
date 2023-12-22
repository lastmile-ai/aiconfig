import { ClientPrompt } from "@/src/shared/types";
import { Button } from "@mantine/core";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { memo } from "react";

type Props = {
  prompt: ClientPrompt;
};

export default memo(function ExecutePromptButton({ prompt }: Props) {
  return (
    <Button onClick={() => {}} p="xs" size="xs">
      <IconPlayerPlayFilled size="16" />
    </Button>
  );
});
