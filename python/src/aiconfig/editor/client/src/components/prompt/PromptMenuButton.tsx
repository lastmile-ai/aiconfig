import { Button, Menu, createStyles } from "@mantine/core";
import { IconDotsVertical, IconEraser, IconTrash } from "@tabler/icons-react";
import { memo } from "react";

const useStyles = createStyles(() => ({
  promptMenuButton: {
    marginLeft: -8,
  },
}));

export default memo(function PromptMenuButton({
  showDeleteOutput,
  onDeleteOutput,
  onDeletePrompt,
}: {
  showDeleteOutput: boolean;
  onDeletePrompt: () => void;
  onDeleteOutput: () => void;
}) {
  const { classes } = useStyles();

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
        {showDeleteOutput ? (
          <Menu.Item
            icon={<IconEraser size={16} />}
            onClick={onDeleteOutput}
          >
            Clear Output
          </Menu.Item>
        ) : null}
        <Menu.Item
          icon={<IconTrash size={16} />}
          color="red"
          onClick={onDeletePrompt}
        >
          Delete Prompt
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
});
