import PromptActionBar from "@/src/components/prompt/PromptActionBar";
import PromptInputRenderer from "@/src/components/prompt/prompt_input/PromptInputRenderer";
import PromptOutputsRenderer from "@/src/components/prompt/prompt_outputs/PromptOutputsRenderer";
import { ClientPrompt } from "@/src/shared/types";
import { getPromptModelName, getPromptSchema } from "@/src/utils/promptUtils";
import { Flex, Card, Text, createStyles } from "@mantine/core";
import { PromptInput as AIConfigPromptInput } from "aiconfig";
import { memo, useCallback } from "react";

type Props = {
  index: number;
  prompt: ClientPrompt;
  onChangePromptInput: (i: number, newPromptInput: AIConfigPromptInput) => void;
  onUpdateModelSettings: (i: number, newModelSettings: any) => void;
  defaultConfigModelName?: string;
};

const useStyles = createStyles((theme) => ({
  promptInputCard: {
    flex: 1,
    borderRight: "0 !important",
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0,
  },
  actionBarCard: {
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
  },
}));

export default memo(function PromptContainer({
  prompt,
  index,
  onChangePromptInput,
  defaultConfigModelName,
  onUpdateModelSettings,
}: Props) {
  const onChangeInput = useCallback(
    (newInput: AIConfigPromptInput) => onChangePromptInput(index, newInput),
    [index, onChangePromptInput]
  );

  const updateModelSettings = useCallback(
    (newModelSettings: any) => onUpdateModelSettings(index, newModelSettings),
    [index, onUpdateModelSettings]
  );

  // TODO: When adding support for custom PromptContainers, implement a PromptContainerRenderer which
  // will take in the index and callback and render the appropriate PromptContainer with new memoized
  // callback and not having to pass index down to PromptContainer

  const promptSchema = getPromptSchema(prompt, defaultConfigModelName);
  const inputSchema = promptSchema?.input;

  const { classes } = useStyles();

  return (
    <Flex justify="space-between" mt="md">
      <Card withBorder className={classes.promptInputCard}>
        <Flex direction="column">
          <Flex justify="space-between">
            <Text weight="bold">{`{{${prompt.name}}}}`}</Text>
            <Text>{getPromptModelName(prompt, defaultConfigModelName)}</Text>
          </Flex>
          <PromptInputRenderer
            input={prompt.input}
            schema={inputSchema}
            onChangeInput={onChangeInput}
          />
          {prompt.outputs && <PromptOutputsRenderer outputs={prompt.outputs} />}
        </Flex>
      </Card>
      <Card withBorder className={classes.actionBarCard}>
        <PromptActionBar
          prompt={prompt}
          promptSchema={promptSchema}
          onUpdateModelSettings={updateModelSettings}
        />
      </Card>
    </Flex>
  );
});
