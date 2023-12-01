import ModelSettingsConfigRenderer from "@/src/components/prompt/model_settings/ModelSettingsConfigRenderer";
import ModelSettingsSchemaRenderer from "@/src/components/prompt/model_settings/ModelSettingsSchemaRenderer";
import { ModelSettingsSchema } from "@/src/utils/promptUtils";
import { Flex, Text } from "@mantine/core";
import { Prompt } from "aiconfig";
import { memo } from "react";

type Props = {
  prompt: Prompt;
  schema?: ModelSettingsSchema;
};

// Don't default to config-level model settings since that could be confusing
// to have them shown at the prompt level in the editor but not in the config
function getModelSettings(prompt: Prompt) {
  if (typeof prompt.metadata?.model !== "string") {
    return prompt.metadata?.model?.settings;
  }
}

export default memo(function ModelSettingsRenderer({ prompt, schema }: Props) {
  const modelSettings = getModelSettings(prompt);

  let settingsComponent;

  if (schema) {
    settingsComponent = (
      <ModelSettingsSchemaRenderer settings={modelSettings} schema={schema} />
    );
  } else if (modelSettings) {
    settingsComponent = (
      <ModelSettingsConfigRenderer settings={modelSettings} />
    );
  }

  return (
    <Flex direction="column">
      <Text>Model Settings</Text>
      {settingsComponent}
    </Flex>
  );
});
