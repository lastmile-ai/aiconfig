import ModelSettingsRenderer from "./model_settings/ModelSettingsRenderer";
import PromptMetadataRenderer from "./prompt_metadata/PromptMetadataRenderer";
import { ClientPrompt } from "../../shared/types";
import {
  PromptSchema,
  checkParametersSupported,
} from "../../utils/promptUtils";
import { ActionIcon, Container, Flex, Tabs } from "@mantine/core";
import { IconClearAll } from "@tabler/icons-react";
import { memo, useState } from "react";
import ParametersRenderer from "../ParametersRenderer";
import { JSONObject } from "aiconfig";

type Props = {
  prompt: ClientPrompt;
  promptSchema?: PromptSchema;
  onUpdateModelSettings: (settings: Record<string, unknown>) => void;
  onUpdateParameters: (parameters: JSONObject) => void;
};

// Don't default to config-level model settings since that could be confusing
// to have them shown at the prompt level in the editor but not in the config
function getModelSettings(prompt: ClientPrompt) {
  if (typeof prompt.metadata?.model !== "string") {
    return prompt.metadata?.model?.settings;
  }
}

function getPromptParameters(prompt: ClientPrompt) {
  return prompt.metadata?.parameters;
}

export default memo(function PromptActionBar({
  prompt,
  promptSchema,
  onUpdateModelSettings,
  onUpdateParameters,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  // TODO: Handle drag-to-resize
  const modelSettingsSchema = promptSchema?.model_settings;
  const promptMetadataSchema = promptSchema?.prompt_metadata;

  return (
    <Flex direction="column" justify="space-between" h="100%">
      {isExpanded ? (
        <>
          <Container miw="400px">
            <ActionIcon
              size="sm"
              onClick={() => setIsExpanded(false)}
              mt="0.5em"
            >
              <IconClearAll />
            </ActionIcon>
            <Tabs defaultValue="settings" mb="1em">
              <Tabs.List>
                <Tabs.Tab value="settings">Settings</Tabs.Tab>
                {checkParametersSupported(prompt) && (
                  <Tabs.Tab value="parameters">
                    Local Variables (Parameters)
                  </Tabs.Tab>
                )}
              </Tabs.List>

              <Tabs.Panel value="settings" className="actionTabsPanel">
                <ModelSettingsRenderer
                  settings={getModelSettings(prompt)}
                  schema={modelSettingsSchema}
                  onUpdateModelSettings={onUpdateModelSettings}
                />
                <PromptMetadataRenderer
                  prompt={prompt}
                  schema={promptMetadataSchema}
                />
              </Tabs.Panel>

              {checkParametersSupported(prompt) && (
                <Tabs.Panel value="parameters" className="actionTabsPanel">
                  <ParametersRenderer
                    initialValue={getPromptParameters(prompt)}
                    onUpdateParameters={onUpdateParameters}
                  />
                </Tabs.Panel>
              )}
            </Tabs>
          </Container>
        </>
      ) : (
        <Flex direction="column" justify="space-between" h="100%">
          <Flex direction="row" justify="center" mt="0.5em">
            <ActionIcon size="sm" onClick={() => setIsExpanded(true)}>
              <IconClearAll />
            </ActionIcon>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
});
