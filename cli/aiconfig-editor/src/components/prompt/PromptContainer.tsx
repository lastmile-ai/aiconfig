import PromptActionBar from "@/src/components/prompt/PromptActionBar";
import PromptInputRenderer from "@/src/components/prompt/prompt_input/PromptInputRenderer";
import { getPromptModelName, getPromptSchema } from "@/src/utils/promptUtils";
import { Flex, Card, Text, createStyles } from "@mantine/core";
import { Prompt, PromptInput as AIConfigPromptInput } from "aiconfig";
import { memo, useCallback } from "react";

type Props = {
  index: number;
  prompt: Prompt;
  onChangePromptInput: (i: number, newPromptInput: AIConfigPromptInput) => void;
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
}: Props) {
  // TODO: Move this to context
  const onChangeInput = useCallback(
    (newInput: AIConfigPromptInput) => onChangePromptInput(index, newInput),
    [index, onChangePromptInput]
  );

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
          {/* <PromptOutput /> */}
        </Flex>
      </Card>
      <Card withBorder className={classes.actionBarCard}>
        <PromptActionBar prompt={prompt} promptSchema={promptSchema} />
      </Card>
    </Flex>
  );
});
