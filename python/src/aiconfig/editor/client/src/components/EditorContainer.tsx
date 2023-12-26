import PromptContainer from "./prompt/PromptContainer";
import { Container, Group, Button, createStyles, Stack } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { AIConfig, Prompt, PromptInput } from "aiconfig";
import { useCallback, useReducer, useRef, useState } from "react";
import aiconfigReducer, { AIConfigReducerAction } from "./aiconfigReducer";
import { ClientAIConfig, clientConfigToAIConfig } from "../shared/types";
import AddPromptButton from "./prompt/AddPromptButton";
import { getDefaultNewPromptName } from "../utils/aiconfigStateUtils";

type Props = {
  aiconfig: ClientAIConfig;
  addPrompt: (
    promptName: string,
    prompt: Prompt
  ) => Promise<{ aiconfig: AIConfig }>;
  onSave: (aiconfig: AIConfig) => Promise<void>;
  getModels: (search: string) => Promise<string[]>;
};

const useStyles = createStyles((theme) => ({
  addPromptRow: {
    borderRadius: "4px",
    display: "inline-block",
    bottom: -24,
    left: -40,
    "&:hover": {
      backgroundColor:
        theme.colorScheme === "light"
          ? theme.colors.gray[1]
          : "rgba(255, 255, 255, 0.1)",
    },
    [theme.fn.smallerThan("sm")]: {
      marginLeft: "0",
      display: "block",
      position: "static",
      bottom: -10,
      left: 0,
      height: 28,
      margin: "10px 0",
    },
  },
  promptsContainer: {
    [theme.fn.smallerThan("sm")]: {
      padding: "0 0 200px 0",
    },
    paddingBottom: 400,
  },
}));

export default function EditorContainer({
  aiconfig: initialAIConfig,
  addPrompt,
  onSave,
  getModels,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [aiconfigState, dispatch] = useReducer(
    aiconfigReducer,
    initialAIConfig
  );

  const stateRef = useRef(aiconfigState);
  stateRef.current = aiconfigState;

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
      // TODO: Call server-side endpoint to update prompt parameters
    },
    [dispatch]
  );

  const onAddPrompt = useCallback(
    async (promptIndex: number, model: string) => {
      const promptName = getDefaultNewPromptName(stateRef.current as AIConfig);
      const newPrompt: Prompt = {
        name: promptName,
        input: "", // TODO: Can we use schema to get input structure, string vs object?
        metadata: {
          model,
        },
      };

      const action: AIConfigReducerAction = {
        type: "ADD_PROMPT_AT_INDEX",
        index: promptIndex,
        prompt: newPrompt,
      };

      dispatch(action);

      try {
        const serverConfigRes = await addPrompt(promptName, newPrompt);
        dispatch({
          type: "CONSOLIDATE_AICONFIG",
          action,
          config: serverConfigRes.aiconfig,
        });
      } catch (err: any) {
        showNotification({
          title: "Error adding prompt to config",
          message: err.message,
          color: "red",
        });
      }
    },
    [addPrompt, dispatch]
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
            <Stack key={prompt.name}>
              <PromptContainer
                index={i}
                prompt={prompt}
                onChangePromptInput={onChangePromptInput}
                onUpdateModelSettings={onUpdatePromptModelSettings}
                onUpdateParameters={onUpdatePromptParameters}
                defaultConfigModelName={aiconfigState.metadata.default_model}
              />
              <div className={classes.addPromptRow}>
                <AddPromptButton
                  getModels={getModels}
                  addPrompt={(model: string) =>
                    onAddPrompt(
                      i + 1 /* insert below current prompt index */,
                      model
                    )
                  }
                />
              </div>
            </Stack>
          );
        })}
      </Container>
    </>
  );
}
