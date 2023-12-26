import PromptContainer from "./prompt/PromptContainer";
import { Container, Group, Button, createStyles } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { AIConfig, PromptInput } from "aiconfig";
import { useCallback, useReducer, useState } from "react";
import aiconfigReducer from "./aiconfigReducer";
import { ClientAIConfig, clientConfigToAIConfig } from "../shared/types";

type Props = {
  aiconfig: ClientAIConfig;
  onSave: (aiconfig: AIConfig) => Promise<void>;
};

const useStyles = createStyles((theme) => ({
  promptsContainer: {
    [theme.fn.smallerThan("sm")]: {
      padding: "0 0 200px 0",
    },
    paddingBottom: 400,
  },
}));

export default function EditorContainer({
  aiconfig: initialAIConfig,
  onSave,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [aiconfigState, dispatch] = useReducer(
    aiconfigReducer,
    initialAIConfig
  );

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(clientConfigToAIConfig(aiconfigState));
    } catch (err: any) {
      showNotification({
        title: "Error saving",
        message: err.message,
        color: "red",
      });
    } finally {
      setIsSaving(false);
    }
  }, [aiconfigState, onSave]);

  const onChangePromptInput = useCallback(
    async (promptIndex: number, newPromptInput: PromptInput) => {
      dispatch({
        type: "UPDATE_PROMPT_INPUT",
        index: promptIndex,
        input: newPromptInput,
      });
      // TODO: Call server-side endpoint to update prompt input
    },
    [dispatch]
  );

  const onUpdatePromptModelSettings = useCallback(
    async (promptIndex: number, newModelSettings: any) => {
      dispatch({
        type: "UPDATE_PROMPT_MODEL_SETTINGS",
        index: promptIndex,
        modelSettings: newModelSettings,
      });
      // TODO: Call server-side endpoint to update model settings
    },
    [dispatch]
  );

  const onUpdatePromptParameters = useCallback(
    async (promptIndex: number, newParameters: any) => {
      dispatch({
        type: "UPDATE_PROMPT_PARAMETERS",
        index: promptIndex,
        parameters: newParameters,
      });
      // TODO: Call server-side endpoint to update model settings
    },
    [dispatch]
  );

  const { classes } = useStyles();

  // TODO: Implement editor context for callbacks, readonly state, etc.

  return (
    <>
      <Container maw="80rem">
        <Group grow m="sm">
          {/* <Text sx={{ textOverflow: "ellipsis", overflow: "hidden" }} size={14}>
            {path || "No path specified"}
          </Text> */}
          <Button loading={isSaving} ml="lg" onClick={save}>
            Save
          </Button>
        </Group>
      </Container>
      <Container maw="80rem" className={classes.promptsContainer}>
        {aiconfigState.prompts.map((prompt: any, i: number) => {
          return (
            <PromptContainer
              index={i}
              prompt={prompt}
              key={prompt.name}
              onChangePromptInput={onChangePromptInput}
              onUpdateModelSettings={onUpdatePromptModelSettings}
              onUpdateParameters={onUpdatePromptParameters}
              defaultConfigModelName={aiconfigState.metadata.default_model}
            />
          );
        })}
      </Container>
    </>
  );
}
