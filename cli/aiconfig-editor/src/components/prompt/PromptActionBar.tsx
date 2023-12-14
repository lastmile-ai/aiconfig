import PromptParametersRenderer from "@/src/components/prompt/PromptParametersRenderer";
import ModelSettingsRenderer from "@/src/components/prompt/model_settings/ModelSettingsRenderer";
import PromptMetadataRenderer from "@/src/components/prompt/prompt_metadata/PromptMetadataRenderer";
import {
  PromptSchema,
  checkParametersSupported,
} from "@/src/utils/promptUtils";
import { ActionIcon, Button, Flex } from "@mantine/core";
import { IconClearAll } from "@tabler/icons-react";
import { Prompt } from "aiconfig";
import { memo, useState } from "react";

type Props = {
  prompt: Prompt;
  promptSchema?: PromptSchema;
};

export default memo(function PromptActionBar({ prompt, promptSchema }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  // TODO: Handle drag-to-resize
  const modelSettingsSchema = promptSchema?.model_settings;
  const promptMetadataSchema = promptSchema?.prompt_metadata;

  return (
    <Flex direction="column" justify="space-between">
      {isExpanded ? (
        <>
          <ActionIcon size="sm" onClick={() => setIsExpanded(false)}>
            <IconClearAll />
          </ActionIcon>
          <ModelSettingsRenderer prompt={prompt} schema={modelSettingsSchema} />
          <PromptMetadataRenderer
            prompt={prompt}
            schema={promptMetadataSchema}
          />
          {checkParametersSupported(prompt) && (
            <PromptParametersRenderer prompt={prompt} />
          )}{" "}
        </>
      ) : (
        <ActionIcon size="sm" onClick={() => setIsExpanded(true)}>
          <IconClearAll />
        </ActionIcon>
      )}
    </Flex>
  );
});
