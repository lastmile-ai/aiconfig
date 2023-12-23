import ModelSettingsConfigRenderer from "./ModelSettingsConfigRenderer";
import ModelSettingsSchemaRenderer from "./ModelSettingsSchemaRenderer";
import { GenericPropertiesSchema } from "../../../utils/promptUtils";
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
