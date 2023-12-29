import PromptActionBar from "./PromptActionBar";
import PromptInputRenderer from "./prompt_input/PromptInputRenderer";
import PromptOutputsRenderer from "./prompt_outputs/PromptOutputsRenderer";
import { ClientPrompt } from "../../shared/types";
import { getPromptSchema } from "../../utils/promptUtils";
import { Flex, Card, createStyles } from "@mantine/core";
import { PromptInput as AIConfigPromptInput, JSONObject } from "aiconfig";
import { memo, useCallback } from "react";
import PromptOutputBar from "./PromptOutputBar";
import PromptName from "./PromptName";
import ModelSelector from "./ModelSelector";

type Props = {
  prompt: ClientPrompt;
  getModels: (search: string) => Promise<string[]>;
  onChangePromptInput: (
    promptId: string,
    newPromptInput: AIConfigPromptInput
  ) => void;
  onChangePromptName: (promptId: string, newName: string) => void;
  onRunPrompt(promptId: string): Promise<void>;
  onUpdateModel: (promptId: string, newModel?: string) => void;
  onUpdateModelSettings: (
    ppromptId: string,
    newModelSettings: JSONObject
  ) => void;
  onUpdateParameters: (
    promptId: string,
    newParameters: Record<string, unknown>
  ) => void;
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
  getModels,
  onChangePromptInput,
  onChangePromptName,
  defaultConfigModelName,
  onRunPrompt,
  onUpdateModel,
  onUpdateModelSettings,
  onUpdateParameters,
}: Props) {
  const promptId = prompt._ui.id;
  const onChangeInput = useCallback(
    (newInput: AIConfigPromptInput) => onChangePromptInput(promptId, newInput),
    [promptId, onChangePromptInput]
  );

  const onChangeName = useCallback(
    (newName: string) => onChangePromptName(promptId, newName),
    [promptId, onChangePromptName]
  );

  const updateModelSettings = useCallback(
    (newModelSettings: JSONObject) =>
      onUpdateModelSettings(promptId, newModelSettings),
    [promptId, onUpdateModelSettings]
  );

  const updateParameters = useCallback(
    (parameters: JSONObject) => onUpdateParameters(promptId, parameters),
    [promptId, onUpdateParameters]
  );

  const runPrompt = useCallback(
    async () => await onRunPrompt(promptId),
    [promptId, onRunPrompt]
  );

  const updateModel = useCallback(
    (model?: string) => onUpdateModel(promptId, model),
    [promptId, onUpdateModel]
  );

  // TODO: When adding support for custom PromptContainers, implement a PromptContainerRenderer which
  // will take in the promptId and callback and render the appropriate PromptContainer with new memoized
  // callback and not having to pass promptId down to PromptContainer

  const promptSchema = getPromptSchema(prompt, defaultConfigModelName);
  const inputSchema = promptSchema?.input;

  const { classes } = useStyles();

  return (
    <Flex justify="space-between" w="100%">
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
