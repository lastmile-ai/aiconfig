import { Button, Menu, createStyles } from "@mantine/core";
import { IconDotsVertical, IconEraser, IconTrash } from "@tabler/icons-react";
import { memo, useCallback } from "react";
import { ClientPrompt } from "../../shared/types";

const useStyles = createStyles(() => ({
  promptMenuButton: {
    marginLeft: -8,
  },
}));

export default memo(function PromptMenuButton({
  promptId,
  prompt,
  onDeleteOutput,
  onDeletePrompt,
}: {
  promptId: string;
  prompt: ClientPrompt;
  onDeletePrompt: (id: string) => void;
  onDeleteOutput: (promptId: string) => void;
}) {
  const { classes } = useStyles();

  const deleteOutput = useCallback(
    async () => await onDeleteOutput(promptId),
    [promptId, onDeleteOutput]
  );

  const deletePrompt = useCallback(
    async () => await onDeletePrompt(promptId),
    [promptId, onDeletePrompt]
  );

  return (
    <Menu position="bottom-end">
      <Menu.Target>
        <Button
          size="xs"
          variant="subtle"
          color="dark"
          className={`${classes.promptMenuButton} promptMenuButton`}
        >
          <IconDotsVertical size={14} />
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        {prompt.outputs?.length ? (
          <Menu.Item
            icon={<IconEraser size={16} />}
            color="white"
            onClick={deleteOutput}
          >
            Clear Output
          </Menu.Item>
        ) : null}
        <Menu.Item
          icon={<IconTrash size={16} />}
          color="red"
          onClick={deletePrompt}
        >
          Delete Prompt
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
});
