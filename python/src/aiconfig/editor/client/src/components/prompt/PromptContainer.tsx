import PromptActionBar from "./PromptActionBar";
import PromptInputRenderer from "./prompt_input/PromptInputRenderer";
import PromptOutputsRenderer from "./prompt_outputs/PromptOutputsRenderer";
import { ClientPrompt } from "../../shared/types";
import { getPromptSchema } from "../../utils/promptUtils";
import { Flex, Card, createStyles } from "@mantine/core";
import { PromptInput as AIConfigPromptInput } from "aiconfig";
import { memo, useCallback } from "react";
import { ParametersArray } from "../ParametersRenderer";
import PromptOutputBar from "./PromptOutputBar";
import PromptName from "./PromptName";
import ModelSelector from "./ModelSelector";

type Props = {
  index: number;
  prompt: ClientPrompt;
  getModels: (search: string) => Promise<string[]>;
  onChangePromptInput: (
    promptIndex: number,
    newPromptInput: AIConfigPromptInput
  ) => void;
  onChangePromptName: (promptIndex: number, newName: string) => void;
  onRunPrompt(promptIndex: number): Promise<void>;
  onUpdateModel: (promptIndex: number, newModel?: string) => void;
  onUpdateModelSettings: (promptIndex: number, newModelSettings: any) => void;
  onUpdateParameters: (promptIndex: number, newParameters: any) => void;
  defaultConfigModelName?: string;
};

const useStyles = createStyles((theme) => ({
  promptInputCard: {
    flex: 1,
    borderRight: "0 !important",
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0,
  },
  actionBar: {
    border: `1px solid ${theme.colors.gray[3]}`,
    borderRadius: "0.25em",
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
  },
}));

export default memo(function PromptContainer({
  prompt,
  index,
  getModels,
  onChangePromptInput,
  onChangePromptName,
  defaultConfigModelName,
  onRunPrompt,
  onUpdateModel,
  onUpdateModelSettings,
  onUpdateParameters,
}: Props) {
  const onChangeInput = useCallback(
    (newInput: AIConfigPromptInput) => onChangePromptInput(index, newInput),
    [index, onChangePromptInput]
  );

  const onChangeName = useCallback(
    (newName: string) => onChangePromptName(index, newName),
    [index, onChangePromptName]
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

  const runPrompt = useCallback(
    async () => await onRunPrompt(index),
    [index, onRunPrompt]
  );

  const updateModel = useCallback(
    (model?: string) => onUpdateModel(index, model),
    [index, onUpdateModel]
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
          <Flex justify="space-between" mb="0.5em">
            <PromptName name={prompt.name} onUpdate={onChangeName} />
            <ModelSelector
              getModels={getModels}
              prompt={prompt}
              onSetModel={updateModel}
              defaultConfigModelName={defaultConfigModelName}
            />
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
      <div className={classes.actionBar}>
        <PromptActionBar
          prompt={prompt}
          promptSchema={promptSchema}
          onRunPrompt={runPrompt}
          onUpdateModelSettings={updateModelSettings}
          onUpdateParameters={updateParameters}
        />
      </div>
    </Flex>
  );
});
