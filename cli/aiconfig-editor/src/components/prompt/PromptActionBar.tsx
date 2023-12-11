import PromptParametersRenderer from "@/src/components/prompt/PromptParametersRenderer";
import ModelSettingsRenderer from "@/src/components/prompt/model_settings/ModelSettingsRenderer";
import PromptMetadataRenderer from "@/src/components/prompt/prompt_metadata/PromptMetadataRenderer";
import {
  PromptSchema,
  checkParametersSupported,
} from "@/src/utils/promptUtils";
import { Flex } from "@mantine/core";
import { Prompt } from "aiconfig";
import { memo } from "react";

type Props = {
  prompt: Prompt;
  promptSchema?: PromptSchema;
};

export default memo(function PromptActionBar({ prompt, promptSchema }: Props) {
  // TODO: Handle collapse / expand / drag-to-resize
  const modelSettingsSchema = promptSchema?.model_settings;
  const promptMetadataSchema = promptSchema?.prompt_metadata;

  return (
    <Flex
      direction="column"
      justify="space-between"
      style={{ borderLeft: "1px solid grey" }}
    >
      <ModelSettingsRenderer prompt={prompt} schema={modelSettingsSchema} />
      <PromptMetadataRenderer prompt={prompt} schema={promptMetadataSchema} />
      {checkParametersSupported(prompt) && (
        <PromptParametersRenderer prompt={prompt} />
      )}
    </Flex>
  );
});
