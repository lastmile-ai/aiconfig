import ExecutePromptButton from "@/src/components/prompt/ExecutePromptButton";
import PromptParametersRenderer from "@/src/components/prompt/PromptParametersRenderer";
import ModelSettingsRenderer from "@/src/components/prompt/model_settings/ModelSettingsRenderer";
import PromptMetadataRenderer from "@/src/components/prompt/prompt_metadata/PromptMetadataRenderer";
import { ClientPrompt } from "@/src/shared/types";
import {
  PromptSchema,
  checkParametersSupported,
} from "@/src/utils/promptUtils";
import { ActionIcon, Container, Flex } from "@mantine/core";
import { IconClearAll } from "@tabler/icons-react";
import { memo, useState } from "react";

type Props = {
  prompt: ClientPrompt;
  promptSchema?: PromptSchema;
  onUpdateModelSettings: (settings: Record<string, unknown>) => void;
};

// Don't default to config-level model settings since that could be confusing
// to have them shown at the prompt level in the editor but not in the config
function getModelSettings(prompt: ClientPrompt) {
  if (typeof prompt.metadata?.model !== "string") {
    return prompt.metadata?.model?.settings;
  }
}

export default memo(function PromptActionBar({
  prompt,
  promptSchema,
  onUpdateModelSettings,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  // TODO: Handle drag-to-resize
  const modelSettingsSchema = promptSchema?.model_settings;
  const promptMetadataSchema = promptSchema?.prompt_metadata;

  return isExpanded ? (
    <Container miw="400px">
      <ActionIcon size="sm" onClick={() => setIsExpanded(false)}>
        <IconClearAll />
      </ActionIcon>
      <ModelSettingsRenderer
        settings={getModelSettings(prompt)}
        schema={modelSettingsSchema}
        onUpdateModelSettings={onUpdateModelSettings}
      />
      <PromptMetadataRenderer prompt={prompt} schema={promptMetadataSchema} />
      {checkParametersSupported(prompt) && (
        <PromptParametersRenderer prompt={prompt} />
      )}{" "}
      <ExecutePromptButton prompt={prompt} />
    </Container>
  ) : (
    <Flex direction="column" justify="space-between" h="100%">
      <ActionIcon size="sm" onClick={() => setIsExpanded(true)}>
        <IconClearAll />
      </ActionIcon>
      <ExecutePromptButton prompt={prompt} />
    </Flex>
  );
});
