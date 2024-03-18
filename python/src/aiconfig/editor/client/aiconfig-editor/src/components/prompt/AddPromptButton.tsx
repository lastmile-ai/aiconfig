import { ActionIcon, Menu, Tooltip, createStyles, rem } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { memo, useCallback, useState } from "react";
import { PROMPT_CELL_LEFT_MARGIN_PX } from "../../utils/constants";
import ModelMenuDropdown from "../models/ModelMenuDropdown";

type Props = {
  addPrompt: (prompt: string) => void;
  getModels?: (search?: string) => Promise<string[]>;
};

const useStyles = createStyles((theme) => ({
  addPromptRow: {
    borderRadius: rem(4),
    display: "flex",
    justifyContent: "center",
    marginLeft: PROMPT_CELL_LEFT_MARGIN_PX,
    align: "center",
    "&:hover": {
      backgroundColor:
        theme.colorScheme === "light"
          ? theme.colors.gray[1]
          : "rgba(255, 255, 255, 0.1)",
    },
    [theme.fn.smallerThan("sm")]: {
      marginLeft: "0",
      display: "block",
      position: "static",
      bottom: -10,
      left: 0,
      height: 28,
      margin: "10px 0",
    },
  },
}));

export default memo(function AddPromptButton({ addPrompt, getModels }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const onAddPrompt = useCallback(
    (model: string) => {
      addPrompt(model);
      setIsOpen(false);
    },
    [addPrompt]
  );

  const { classes } = useStyles();

  return (
    <div className={`${classes.addPromptRow} addPromptRow`}>
      <Menu
        position="bottom"
        // Manually maintain open state to support ... expand button
        closeOnItemClick={false}
        opened={isOpen}
        onChange={setIsOpen}
      >
        <Menu.Target>
          <Tooltip label="Add prompt">
            <ActionIcon w="100%">
              <IconPlus size={20} />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>

        <ModelMenuDropdown getModels={getModels} onSelectModel={onAddPrompt} />
        {/* TODO: Add back once we have custom model parsers fully supported
        <Menu.Divider />
        <Menu.Item icon={<IconPlus size="16" />}>Add New Model</Menu.Item> */}
      </Menu>
    </div>
  );
});
