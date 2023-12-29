import PromptContainer from "./prompt/PromptContainer";
import {
  Container,
  Group,
  Button,
  createStyles,
  Stack,
  Flex,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { AIConfig, ModelMetadata, Prompt, PromptInput } from "aiconfig";
import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import aiconfigReducer, { AIConfigReducerAction } from "./aiconfigReducer";
import {
  ClientPrompt,
  aiConfigToClientConfig,
  clientConfigToAIConfig,
  clientPromptToAIConfigPrompt,
} from "../shared/types";
import AddPromptButton from "./prompt/AddPromptButton";
import {
  getDefaultNewPromptName,
  getPrompt,
} from "../utils/aiconfigStateUtils";
import { debounce, uniqueId } from "lodash";
import PromptMenuButton from "./prompt/PromptMenuButton";

type Props = {
  aiconfig: AIConfig;
  callbacks: AIConfigCallbacks;
};

export type AIConfigCallbacks = {
  addPrompt: (
    promptName: string,
    prompt: Prompt,
    index: number
  ) => Promise<{ aiconfig: AIConfig }>;
  deletePrompt: (promptName: string) => Promise<void>;
  getModels: (search: string) => Promise<string[]>;
  runPrompt: (promptName: string) => Promise<{ aiconfig: AIConfig }>;
  save: (aiconfig: AIConfig) => Promise<void>;
  updateModel: (
    promptName?: string,
    modelData?: string | ModelMetadata
  ) => Promise<void /*{ aiconfig: AIConfig }*/>;
  updatePrompt: (
    promptName: string,
    promptData: Prompt
  ) => Promise<{ aiconfig: AIConfig }>;
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
  callbacks,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [aiconfigState, dispatch] = useReducer(
    aiconfigReducer,
    aiConfigToClientConfig(initialAIConfig)
  );

  const stateRef = useRef(aiconfigState);
  stateRef.current = aiconfigState;

  const onSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await callbacks.save(clientConfigToAIConfig(stateRef.current));
    } catch (err: any) {
      showNotification({
        title: "Error saving",
        message: err.message,
        color: "red",
      });
    } finally {
      setIsSaving(false);
    }
  }, [callbacks.save]);

  const debouncedUpdatePrompt = useMemo(
    () =>
      debounce(
        (promptName: string, newPrompt: Prompt) =>
          callbacks.updatePrompt(promptName, newPrompt),
        250
      ),
    [callbacks.updatePrompt]
  );

  const onChangePromptInput = useCallback(
    async (promptId: string, newPromptInput: PromptInput) => {
      const action: AIConfigReducerAction = {
        type: "UPDATE_PROMPT_INPUT",
        id: promptId,
        input: newPromptInput,
      };

      dispatch(action);

      try {
        const prompt = clientPromptToAIConfigPrompt(
          getPrompt(stateRef.current, promptId)!
        );
        const serverConfigRes = await debouncedUpdatePrompt(prompt.name, {
          ...prompt,
          input: newPromptInput,
        });

        dispatch({
          type: "CONSOLIDATE_AICONFIG",
          action,
          config: serverConfigRes!.aiconfig,
        });
      } catch (err: any) {
        showNotification({
          title: "Error adding prompt to config",
          message: err.message,
          color: "red",
        });
      }
    },
    [dispatch, debouncedUpdatePrompt]
  );

  const onChangePromptName = useCallback(
    async (promptId: string, newName: string) => {
      const action: AIConfigReducerAction = {
        type: "UPDATE_PROMPT_NAME",
        id: promptId,
        name: newName,
      };

      dispatch(action);
    },
    [dispatch]
  );

  const debouncedUpdateModel = useMemo(
    () =>
      debounce(
        (promptName?: string, modelMetadata?: string | ModelMetadata) =>
          callbacks.updateModel(promptName, modelMetadata),
        250
      ),
    [callbacks.updatePrompt]
  );

  const onUpdatePromptModelSettings = useCallback(
    async (promptId: string, newModelSettings: any) => {
      dispatch({
        type: "UPDATE_PROMPT_MODEL_SETTINGS",
        id: promptId,
        modelSettings: newModelSettings,
      });
      // TODO: Call server-side endpoint to update model
    },
    [dispatch]
  );

  const onUpdatePromptModel = useCallback(
    async (promptId: string, newModel?: string) => {
      dispatch({
        type: "UPDATE_PROMPT_MODEL",
        id: promptId,
        modelName: newModel,
      });

      try {
        const prompt = clientPromptToAIConfigPrompt(
          getPrompt(stateRef.current, promptId)!
        );
        const currentModel = prompt.metadata?.model;
        let modelData: string | ModelMetadata | undefined = newModel;
        if (newModel && currentModel && typeof currentModel !== "string") {
          modelData = {
            ...currentModel,
            name: newModel,
          };
        }

        await debouncedUpdateModel(prompt.name, modelData);

        // TODO: Consolidate
      } catch (err: any) {
        showNotification({
          title: "Error updating prompt model",
          message: err.message,
          color: "red",
        });
      }
    },
    [dispatch]
  );

  const onUpdatePromptParameters = useCallback(
    async (promptId: string, newParameters: any) => {
      dispatch({
        type: "UPDATE_PROMPT_PARAMETERS",
        id: promptId,
        parameters: newParameters,
      });
      // TODO: Call server-side endpoint to update prompt parameters
    },
    [dispatch]
  );

  const onAddPrompt = useCallback(
    async (promptIndex: number, model: string) => {
      const promptName = getDefaultNewPromptName(
        stateRef.current as unknown as AIConfig
      );

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
        prompt: {
          ...newPrompt,
          _ui: {
            id: uniqueId(),
          },
        },
      };

      dispatch(action);

      try {
        const serverConfigRes = await callbacks.addPrompt(
          promptName,
          newPrompt,
          promptIndex
        );
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
    [callbacks.addPrompt, dispatch]
  );

  const onDeletePrompt = useCallback(
    async (promptId: string) => {
      const action: AIConfigReducerAction = {
        type: "DELETE_PROMPT",
        id: promptId,
      };

      dispatch(action);

      try {
        const prompt = getPrompt(stateRef.current, promptId)!;
        await callbacks.deletePrompt(prompt.name);
      } catch (err: any) {
        showNotification({
          title: "Error deleting prompt",
          message: err.message,
          color: "red",
        });
      }
    },
    [callbacks.deletePrompt, dispatch]
  );

  const onRunPrompt = useCallback(
    async (promptId: string) => {
      const action: AIConfigReducerAction = {
        type: "RUN_PROMPT",
        id: promptId,
      };

      dispatch(action);

      try {
        const promptName = getPrompt(stateRef.current, promptId)!.name;
        const serverConfigRes = await callbacks.runPrompt(promptName);

        dispatch({
          type: "CONSOLIDATE_AICONFIG",
          action,
          config: serverConfigRes.aiconfig,
        });
      } catch (err: any) {
        showNotification({
          title: "Error running prompt",
          message: err.message,
          color: "red",
        });
      }
    },
    [callbacks.runPrompt]
  );

  const { classes } = useStyles();

  return (
    <>
      <Container maw="80rem">
        <Group grow m="sm">
          {/* <Text sx={{ textOverflow: "ellipsis", overflow: "hidden" }} size={14}>
            {path || "No path specified"}
          </Text> */}
          <Button loading={isSaving} ml="lg" onClick={onSave}>
            Save
          </Button>
        </Group>
      </Container>
      <Container maw="80rem" className={classes.promptsContainer}>
        {aiconfigState.prompts.map((prompt: ClientPrompt, i: number) => {
          return (
            <Stack key={prompt._ui.id}>
              <Flex mt="md">
                <PromptMenuButton
                  promptId={prompt._ui.id}
                  onDeletePrompt={() => onDeletePrompt(prompt._ui.id)}
                />
                <PromptContainer
                  prompt={prompt}
                  getModels={callbacks.getModels}
                  onChangePromptInput={onChangePromptInput}
                  onChangePromptName={onChangePromptName}
                  onRunPrompt={onRunPrompt}
                  onUpdateModel={onUpdatePromptModel}
                  onUpdateModelSettings={onUpdatePromptModelSettings}
                  onUpdateParameters={onUpdatePromptParameters}
                  defaultConfigModelName={aiconfigState.metadata.default_model}
                />
              </Flex>
              <div className={classes.addPromptRow}>
                <AddPromptButton
                  getModels={callbacks.getModels}
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
