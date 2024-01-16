import {
  ActionIcon,
  Menu,
  ScrollArea,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { IconPlus, IconSearch, IconTextCaption } from "@tabler/icons-react";
import { memo, useCallback, useState } from "react";
import useLoadModels from "../../hooks/useLoadModels";

type Props = {
  addPrompt: (prompt: string) => void;
  getModels?: (search: string) => Promise<string[]>;
};

function ModelMenuItems({
  models,
  onSelectModel,
  collapseLimit,
}: {
  models: string[];
  onSelectModel: (model: string) => void;
  collapseLimit: number;
}) {
  const [isCollapsed, setIsCollapsed] = useState(models.length > collapseLimit);

  const displayModels = isCollapsed ? models.slice(0, collapseLimit) : models;

  return (
    <ScrollArea mah={300} style={{ overflowY: "auto" }}>
      {displayModels.map((model) => (
        <Menu.Item
          key={model}
          icon={<IconTextCaption size="16" />}
          onClick={() => onSelectModel(model)}
        >
          {model}
        </Menu.Item>
      ))}
      {isCollapsed && (
        <Menu.Item onClick={() => setIsCollapsed(false)}>...</Menu.Item>
      )}
    </ScrollArea>
  );
}

export default memo(function AddPromptButton({ addPrompt, getModels }: Props) {
  const [modelSearch, setModelSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const onAddPrompt = useCallback(
    (model: string) => {
      addPrompt(model);
      setIsOpen(false);
    },
    [addPrompt]
  );

  const models = useLoadModels(modelSearch, getModels);

  return (
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

      <Menu.Dropdown>
        <TextInput
          icon={<IconSearch size="16" />}
          placeholder="Search"
          value={modelSearch}
          onChange={(e) => setModelSearch(e.currentTarget.value)}
        />
        <ModelMenuItems
          models={models ?? []}
          collapseLimit={5}
          onSelectModel={onAddPrompt}
        />
        {/* TODO: Add back once we have custom model parsers fully supported
        <Menu.Divider />
        <Menu.Item icon={<IconPlus size="16" />}>Add New Model</Menu.Item> */}
      </Menu.Dropdown>
    </Menu>
  );
});
