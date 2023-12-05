import PromptInput from "@/src/components/prompt/PromptInput";
import { getPromptModelName } from "@/src/utils/promptUtils";
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
  // TODO: Show prompt name & metadata inside of settings editor later
  const onChangeInput = useCallback(
    (newInput: AIConfigPromptInput) => onChangePromptInput(index, newInput),
    [index, onChangePromptInput]
  );
  return (
    <div style={{ marginTop: 16 }}>
      <Card>
        <Flex justify="space-between" m="sm">
          <Text weight="bold">{`{{${prompt.name}}}}`}</Text>
          <Text>{getPromptModelName(prompt, defaultConfigModelName)}</Text>
        </Flex>
        <PromptInput input={prompt.input} onChangeInput={onChangeInput} />
      </Card>
    </div>
  );
});
