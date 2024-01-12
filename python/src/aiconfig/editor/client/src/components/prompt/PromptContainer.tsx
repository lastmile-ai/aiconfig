import PromptActionBar from "./PromptActionBar";
import PromptInputRenderer from "./prompt_input/PromptInputRenderer";
import PromptOutputsRenderer from "./prompt_outputs/PromptOutputsRenderer";
import { ClientPrompt } from "../../shared/types";
import { getPromptSchema } from "../../utils/promptUtils";
import { Flex, Card } from "@mantine/core";
import {
  PromptInput as AIConfigPromptInput,
  JSONObject,
  JSONValue,
} from "aiconfig";
import { memo, useCallback, useState } from "react";
import PromptOutputBar from "./PromptOutputBar";
import PromptName from "./PromptName";
import ModelSelector from "./ModelSelector";

type Props = {
  prompt: ClientPrompt;
  cancel: (cancellationToken: string) => Promise<void>;
  getModels: (search: string) => Promise<string[]>;
  onChangePromptInput: (
    promptId: string,
    newPromptInput: AIConfigPromptInput
  ) => void;
  onChangePromptName: (promptId: string, newName: string) => void;
  onRunPrompt(promptId: string): Promise<void>;
  onUpdateModel: (promptId: string, newModel?: string) => void;
  onUpdateModelSettings: (
    promptId: string,
    newModelSettings: JSONObject
  ) => void;
  onUpdateParameters: (
    promptId: string,
    newParameters: Record<string, unknown>
  ) => void;
  defaultConfigModelName?: string;
};

export default memo(function PromptContainer({
  prompt,
  cancel,
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

  const [missingRequiredFields, setMissingRequiredFields] = useState(
    new Set<string>()
  );
  const onUpdateMissingRequiredFields = useCallback(
    (fieldName: string, fieldValue: JSONValue) => {
      setMissingRequiredFields((prevState) => {
        const newState = new Set<string>(prevState);
        const isPrimitiveValue =
          typeof fieldValue === "string" ||
          typeof fieldValue === "number" ||
          typeof fieldValue === "boolean" ||
          typeof fieldValue === "undefined" ||
          typeof fieldValue === "bigint";
        if (isPrimitiveValue) {
          if (
            fieldValue == null ||
            fieldValue == undefined ||
            fieldValue === ""
          ) {
            newState.add(fieldName);
          } else {
            newState.delete(fieldName);
          }
          if (fieldName === "model") {
            console.log("new state: ", newState);
          }
        }
        return newState;
      });
    },
    [setMissingRequiredFields]
  );

  const [isExpanded, setIsExpanded] = useState(false);
  const onSetExpandedButton = useCallback(
    (newValue: boolean) => setIsExpanded(newValue),
    [setIsExpanded]
  );

  const runPrompt = useCallback(async () => {
    console.log("missing required fields: ", missingRequiredFields);
    if (missingRequiredFields.size > 0) {
      setIsExpanded(true);
      return;
    } else {
      await onRunPrompt(promptId);
    }
  }, [promptId, onRunPrompt]);

  const onCancelRun = useCallback(async () => {
    if (prompt._ui.cancellationToken) {
      return await cancel(prompt._ui.cancellationToken);
    } else {
      // TODO: saqadri - Maybe surface an error to the user, or explicitly throw an error in this case.
      console.log(
        `Warning: No cancellation token found for prompt: ${prompt.name}`
      );
      return;
    }
  }, [prompt.name, prompt._ui.cancellationToken, cancel]);

  const updateModel = useCallback(
    (model?: string) => onUpdateModel(promptId, model),
    [promptId, onUpdateModel]
  );

  // TODO: When adding support for custom PromptContainers, implement a PromptContainerRenderer which
  // will take in the promptId and callback and render the appropriate PromptContainer with new memoized
  // callback and not having to pass promptId down to PromptContainer

  const promptSchema = getPromptSchema(prompt, defaultConfigModelName);
  const inputSchema = promptSchema?.input;

  return (
    <Flex justify="space-between" w="100%">
      <Card withBorder className="cellStyle">
        <Flex direction="column">
          <Flex justify="space-between" mb="0.5em">
            <PromptName
              promptId={promptId}
              name={prompt.name}
              onUpdate={onChangeName}
            />
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
            onCancelRun={onCancelRun}
            onRunPrompt={runPrompt}
            isRunning={prompt._ui.isRunning}
          />
          <PromptOutputBar />
          {prompt.outputs && <PromptOutputsRenderer outputs={prompt.outputs} />}
        </Flex>
      </Card>
      <div className="sidePanel">
        <PromptActionBar
          isExpanded={isExpanded}
          missingRequiredFields={missingRequiredFields}
          prompt={prompt}
          promptSchema={promptSchema}
          onSetExpandedButton={onSetExpandedButton}
          onUpdateMissingRequiredFields={onUpdateMissingRequiredFields}
          onUpdateModelSettings={updateModelSettings}
          onUpdateParameters={updateParameters}
        />
      </div>
    </Flex>
  );
});
