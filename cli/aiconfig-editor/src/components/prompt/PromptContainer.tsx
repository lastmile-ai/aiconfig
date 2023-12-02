import PromptActionBar from "@/src/components/prompt/PromptActionBar";
import PromptInputRenderer from "@/src/components/prompt/prompt_input/PromptInputRenderer";
import { getPromptModelName, getPromptSchema } from "@/src/utils/promptUtils";
import { Flex, Card, Text } from "@mantine/core";
import { Prompt, PromptInput as AIConfigPromptInput } from "aiconfig";
import { memo, useCallback } from "react";

type Props = {
  index: number;
  prompt: Prompt;
  onChangePromptInput: (i: number, newPromptInput: AIConfigPromptInput) => void;
  defaultConfigModelName?: string;
};

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

  return (
    <div style={{ marginTop: 16 }}>
      <Card withBorder>
        <Flex justify="space-between">
          <Flex direction="column">
            <Flex justify="space-between" m="sm">
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
          <PromptActionBar prompt={prompt} promptSchema={promptSchema} />
        </Flex>
      </Card>
    </div>
  );
});
