import { ActionIcon, Menu, TextInput } from "@mantine/core";
import { IconPlus, IconSearch, IconTextCaption } from "@tabler/icons-react";
import { memo, useCallback, useEffect, useState } from "react";
import { showNotification } from "@mantine/notifications";

type Props = {
  addPrompt: (prompt: string) => void;
  getModels: (search: string) => Promise<string[]>;
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
    <>
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
    </>
  );
}

export default memo(function AddPromptButton({ addPrompt, getModels }: Props) {
  const [modelSearch, setModelSearch] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadModels = useCallback(async (modelSearch: string) => {
    try {
      const models = await getModels(modelSearch);
      setModels(models);
    } catch (err: any) {
      showNotification({
        title: "Error loading models",
        message: err?.message,
        color: "red",
      });
    }
  }, []);

  const onAddPrompt = useCallback((model: string) => {
    addPrompt(model);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    loadModels(modelSearch);
  }, [loadModels, modelSearch]);

  return (
    <Menu
      position="bottom-start"
      // Manually maintain open state to support ... expand button
      closeOnItemClick={false}
      opened={isOpen}
      onChange={setIsOpen}
    >
      <Menu.Target>
        <ActionIcon>
          <IconPlus size={20} />
        </ActionIcon>
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
        <Menu.Divider />
        <Menu.Item icon={<IconPlus size="16" />}>Add New Model</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
});
