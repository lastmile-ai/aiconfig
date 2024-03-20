import { Menu, ScrollArea, TextInput } from "@mantine/core";
import { IconSearch, IconTextCaption } from "@tabler/icons-react";
import useLoadModels from "../../hooks/useLoadModels";
import { useState } from "react";

type Props = {
  getModels?: (search?: string) => Promise<string[]>;
  onSelectModel: (model: string) => void;
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

export default function ModelMenuDropdown({ getModels, onSelectModel }: Props) {
  const [modelSearch, setModelSearch] = useState<string | undefined>();
  const models = useLoadModels(getModels, modelSearch);
  return (
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
        onSelectModel={onSelectModel}
      />
    </Menu.Dropdown>
  );
}
