import { Flex, Stack, createStyles } from "@mantine/core";
import { memo, useContext } from "react";
import AIConfigContext from "../../contexts/AIConfigContext";
import AddPromptButton from "./AddPromptButton";
import { ClientPrompt } from "../../shared/types";
import PromptContainer from "./PromptContainer";
import { JSONObject, PromptInput } from "aiconfig";

type Props = {
  cancelRunPrompt?: (cancellationToken: string) => Promise<void>;
  defaultModel?: string;
  getModels?: (search?: string) => Promise<string[]>;
  onAddPrompt: (promptIndex: number, model: string) => Promise<void>;
  onChangePromptInput: (
    promptId: string,
    newPromptInput: PromptInput
  ) => Promise<void>;
  onChangePromptName: (promptId: string, newName: string) => Promise<void>;
  onDeletePrompt: (promptId: string) => Promise<void>;
  onDeleteOutput: (promptId: string) => Promise<void>;
  onRunPrompt: (promptId: string) => Promise<void>;
  onUpdatePromptMetadata: (
    promptId: string,
    newMetadata: JSONObject
  ) => Promise<void>;
  onUpdatePromptModel: (promptId: string, newModel?: string) => Promise<void>;
  onUpdatePromptModelSettings: (
    promptId: string,
    newModelSettings: JSONObject
  ) => Promise<void>;
  onUpdatePromptParameters: (
    promptId: string,
    newParameters: JSONObject
  ) => Promise<void>;
  prompts: ClientPrompt[];
  runningPromptId?: string;
};

const useStyles = createStyles((theme) => ({
  promptsContainer: {
    [theme.fn.smallerThan("sm")]: {
      padding: "0 0 200px 0",
    },
    paddingBottom: 400,
  },
}));

export default memo(function PromptsContainer(props: Props) {
  const { classes } = useStyles();
  const { readOnly } = useContext(AIConfigContext);

  return (
    <div className={`${classes.promptsContainer} promptsContainer`}>
      {!readOnly && (
        <AddPromptButton
          getModels={props.getModels}
          addPrompt={(model: string) => props.onAddPrompt(0, model)}
        />
      )}
      {props.prompts.map((prompt: ClientPrompt, i: number) => {
        const promptId = prompt._ui.id;
        const isAnotherPromptRunning =
          props.runningPromptId !== undefined &&
          props.runningPromptId !== promptId;

        return (
          <Stack key={prompt._ui.id}>
            <Flex mt="md">
              <PromptContainer
                prompt={prompt}
                getModels={props.getModels}
                onChangePromptInput={props.onChangePromptInput}
                onChangePromptName={props.onChangePromptName}
                cancel={props.cancelRunPrompt}
                onRunPrompt={props.onRunPrompt}
                onDeletePrompt={props.onDeletePrompt}
                onDeleteOutput={props.onDeleteOutput}
                onUpdateModel={props.onUpdatePromptModel}
                onUpdateModelSettings={props.onUpdatePromptModelSettings}
                onUpdateParameters={props.onUpdatePromptParameters}
                onUpdatePromptMetadata={props.onUpdatePromptMetadata}
                defaultConfigModelName={props.defaultModel}
                isRunButtonDisabled={isAnotherPromptRunning}
              />
            </Flex>
            {!readOnly && (
              <AddPromptButton
                getModels={props.getModels}
                addPrompt={(model: string) =>
                  props.onAddPrompt(
                    i + 1 /* insert below current prompt index */,
                    model
                  )
                }
              />
            )}
          </Stack>
        );
      })}
    </div>
  );
});
