import { Button, Menu, createStyles } from "@mantine/core";
import { IconDotsVertical, IconTrash } from "@tabler/icons-react";
import { memo } from "react";

const useStyles = createStyles((theme) => ({
  cellAction: {
    marginLeft: -8,
    [theme.fn.smallerThan("sm")]: {
      float: "left",
      marginTop: -2,
      marginLeft: 0,
      zIndex: 99,
      "&:hover": {
        backgroundColor:
          theme.colorScheme === "dark"
            ? "rgba(0, 0, 0, 0)"
            : "rgba(255, 255, 255, 0)",
      },
    },
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
          className={classes.cellAction}
          style={{}}
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
