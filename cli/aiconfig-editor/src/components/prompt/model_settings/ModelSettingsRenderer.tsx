import ModelSettingsConfigRenderer from "@/src/components/prompt/model_settings/ModelSettingsConfigRenderer";
import ModelSettingsSchemaRenderer from "@/src/components/prompt/model_settings/ModelSettingsSchemaRenderer";
import { GenericPropertiesSchema } from "@/src/utils/promptUtils";
import { Flex, Text } from "@mantine/core";
import { JSONObject } from "aiconfig";
import { memo } from "react";

type Props = {
  settings?: JSONObject;
  schema?: GenericPropertiesSchema;
  onUpdateModelSettings: (settings: Record<string, unknown>) => void;
};

export default memo(function ModelSettingsRenderer({
  settings,
  schema,
  onUpdateModelSettings,
}: Props) {
  let settingsComponent;

  if (schema) {
    settingsComponent = (
      <ModelSettingsSchemaRenderer
        settings={settings}
        schema={schema}
        onUpdateModelSettings={onUpdateModelSettings}
      />
    );
  } else if (settings) {
    settingsComponent = <ModelSettingsConfigRenderer settings={settings} />;
  }

  return (
    <Flex direction="column">
      <Text>Model Settings</Text>
      {settingsComponent}
    </Flex>
  );
});
