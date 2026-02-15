import { JSONObject } from "aiconfig";
import useLoadModels from "../../hooks/useLoadModels";
import {
  ActionIcon,
  Card,
  Divider,
  Flex,
  Menu,
  ScrollArea,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import ModelSettingsRenderer from "../models/model_settings/ModelSettingsRenderer";
import AIConfigContext from "../../contexts/AIConfigContext";
import { useCallback, useContext, useState } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { getPromptSchemaForModel } from "../../utils/promptUtils";
import ModelMenuDropdown from "../models/ModelMenuDropdown";

type Props = {
  deleteModelSettings?: (modelName: string) => void;
  getModels?: (search?: string) => Promise<string[]>;
  modelSettings: JSONObject;
  onUpdateModelSettings: (
    modelName: string,
    newModelSettings: JSONObject
  ) => void;
};

export default function GlobalModelSettingsRenderer({
  deleteModelSettings,
  getModels,
  modelSettings,
  onUpdateModelSettings,
}: Props) {
  const { readOnly } = useContext(AIConfigContext);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  const allModels = useLoadModels(getModels);
  // Show most recently-added models first
  const modelsWithSettings = Object.keys(modelSettings).reverse();

  // User can select any remaining models to add settings for
  const remainingModels = allModels.filter(
    (model) => !modelsWithSettings.includes(model)
  );

  const getRemainingModels = async (search?: string) => {
    if (search && search.length > 0) {
      return remainingModels.filter((model) =>
        model.toLowerCase().includes(search.toLowerCase())
      );
    }
    return remainingModels;
  };

  const onAddModelSettingsRow = useCallback(
    (model: string) => {
      // Add new model settings w/ empty config value, will add row
      // and render with schema if available
      onUpdateModelSettings(model, {});
      setIsModelMenuOpen(false);
    },
    [onUpdateModelSettings]
  );

  return (
    <div>
      <Text color="dimmed" size="sm" p="xs">
        Configure default settings for all prompts using the specified model.
        These settings can be overridden at the prompt level.
      </Text>
      <div>
        {!readOnly && remainingModels.length > 0 && (
          <Menu
            position="bottom"
            // Manually maintain open state to support ... expand button
            closeOnItemClick={false}
            opened={isModelMenuOpen}
            onChange={setIsModelMenuOpen}
          >
            <Menu.Target>
              <Tooltip label="Add model settings">
                <ActionIcon w="100%">
                  <IconPlus size={20} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <ModelMenuDropdown
              getModels={getRemainingModels}
              onSelectModel={onAddModelSettingsRow}
            />
          </Menu>
        )}
        <ScrollArea mah={300} type="auto" style={{ overflowY: "auto" }}>
          {modelsWithSettings.map((modelName, i) => (
            <>
              {i > 0 && <Divider mt="xl" mb="xl" size="xl" />}
              <Card key={modelName}>
                <Flex>
                  <Title order={4} underline>
                    {modelName}
                  </Title>
                  {!readOnly && deleteModelSettings && (
                    <ActionIcon
                      onClick={() => deleteModelSettings(modelName)}
                      ml="0.5em"
                    >
                      <IconTrash size={16} color={"red"} />
                    </ActionIcon>
                  )}
                </Flex>
                <ModelSettingsRenderer
                  model={modelName}
                  onUpdateModelSettings={(settings) =>
                    onUpdateModelSettings(modelName, settings)
                  }
                  schema={getPromptSchemaForModel(modelName)?.model_settings}
                  settings={modelSettings[modelName]}
                />
              </Card>
            </>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}
