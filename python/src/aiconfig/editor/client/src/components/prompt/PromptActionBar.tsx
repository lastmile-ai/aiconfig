import ModelSettingsRenderer from "./model_settings/ModelSettingsRenderer";
import PromptMetadataRenderer from "./prompt_metadata/PromptMetadataRenderer";
import { ClientPrompt } from "../../shared/types";
import {
  PromptSchema,
  checkParametersSupported,
} from "../../utils/promptUtils";
import { ActionIcon, Container, Flex, Tabs, createStyles } from "@mantine/core";
import { IconClearAll } from "@tabler/icons-react";
import { memo } from "react";
import ParametersRenderer from "../ParametersRenderer";
import { JSONObject, JSONValue } from "aiconfig";

type Props = {
  isExpanded?: boolean;
  missingRequiredFields: Set<string>;
  prompt: ClientPrompt;
  promptSchema?: PromptSchema;
  onUpdateMissingRequiredFields: (
    fieldName: string,
    fieldValue: JSONValue
  ) => void;
  onUpdateModelSettings: (settings: Record<string, unknown>) => void;
  onUpdateParameters: (parameters: JSONObject) => void;
  onSetExpandedButton: (newValue: boolean) => void;
};

const useStyles = createStyles(() => ({
  missingFieldsText: {
    // TODO: Fix max height to be full height if input/output is larger than settings
    // otherwise bound to some reasonable height
    color: "red",
    paddingTop: "0.5em",
    width: "100%",
  },
}));

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
  isExpanded = false,
  missingRequiredFields,
  prompt,
  promptSchema,
  onUpdateMissingRequiredFields,
  onUpdateModelSettings,
  onUpdateParameters,
  onSetExpandedButton,
}: Props) {
  const { classes } = useStyles();
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
              onClick={() => onSetExpandedButton(false)}
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
                {missingRequiredFields.size > 0 && (
                  <div className={classes.missingFieldsText}>
                    {"Missing required fields: ["}
                    {Array.from(missingRequiredFields).join(", ")}
                    {"]"}
                  </div>
                )}
                <ModelSettingsRenderer
                  settings={getModelSettings(prompt)}
                  schema={modelSettingsSchema}
                  onUpdateMissingRequiredFields={onUpdateMissingRequiredFields}
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
            <ActionIcon size="sm" onClick={() => onSetExpandedButton(true)}>
              <IconClearAll />
            </ActionIcon>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
});
