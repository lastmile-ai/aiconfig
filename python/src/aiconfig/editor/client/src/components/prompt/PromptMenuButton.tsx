import { Button, Menu, createStyles } from "@mantine/core";
import { IconDotsVertical, IconTrash } from "@tabler/icons-react";
import { memo } from "react";

const useStyles = createStyles(() => ({
  promptMenuButton: {
    marginLeft: -8,
  },
}));

export default memo(function PromptMenuButton({
  promptId,
  onDeletePrompt,
}: {
  promptId: string;
  onDeletePrompt: (id: string) => void;
}) {
  const { classes } = useStyles();

  return (
    <Menu position="bottom-end">
      <Menu.Target>
        <Button
          size="xs"
          variant="subtle"
          color="dark"
          className={classes.promptMenuButton}
        >
          <IconDotsVertical size={14} />
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          icon={<IconTrash size={16} />}
          color="red"
          onClick={() => onDeletePrompt(promptId)}
        >
          Delete Prompt
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
});
