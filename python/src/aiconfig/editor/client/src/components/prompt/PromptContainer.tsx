import PromptActionBar from "./PromptActionBar";
import PromptInputRenderer from "./prompt_input/PromptInputRenderer";
import PromptOutputsRenderer from "./prompt_outputs/PromptOutputsRenderer";
import { ClientPrompt } from "../../shared/types";
import { getPromptModelName, getPromptSchema } from "../../utils/promptUtils";
import { Flex, Card, Text, createStyles } from "@mantine/core";
import { PromptInput as AIConfigPromptInput } from "aiconfig";
import { memo, useCallback } from "react";
import { ParametersArray } from "../ParametersRenderer";
import PromptOutputBar from "./PromptOutputBar";

type Props = {
  index: number;
  prompt: ClientPrompt;
  onChangePromptInput: (i: number, newPromptInput: AIConfigPromptInput) => void;
  onUpdateModelSettings: (i: number, newModelSettings: any) => void;
  onUpdateParameters: (i: number, newParameters: any) => void;
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
  onUpdateParameters,
}: Props) {
  const onChangeInput = useCallback(
    (newInput: AIConfigPromptInput) => onChangePromptInput(index, newInput),
    [index, onChangePromptInput]
  );

  const updateModelSettings = useCallback(
    (newModelSettings: any) => onUpdateModelSettings(index, newModelSettings),
    [index, onUpdateModelSettings]
  );

  const updateParameters = useCallback(
    (data: {
      promptName?: string | undefined;
      newParameters: ParametersArray;
    }) => {
      const newParameters: Record<string, unknown> = {};
      for (const paramTuple of data.newParameters ?? []) {
        const key = paramTuple.parameterName;
        const val = paramTuple.parameterValue;

        newParameters[key] = val;
      }

      onUpdateParameters(index, newParameters);
    },
    [index, onUpdateParameters]
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
          <PromptOutputBar />
          {prompt.outputs && <PromptOutputsRenderer outputs={prompt.outputs} />}
        </Flex>
      </Card>
      <Card withBorder className={classes.actionBarCard}>
        <PromptActionBar
          prompt={prompt}
          promptSchema={promptSchema}
          onUpdateModelSettings={updateModelSettings}
          onUpdateParameters={updateParameters}
        />
      </Card>
    </Flex>
  );
});
