import PromptContainer from "./prompt/PromptContainer";
import { Container, Button, createStyles, Stack, Flex } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import {
  AIConfig,
  InferenceSettings,
  JSONObject,
  Prompt,
  PromptInput,
} from "aiconfig";
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
import GlobalParametersContainer from "./GlobalParametersContainer";
import AIConfigContext from "./AIConfigContext";
import ConfigNameDescription from "./ConfigNameDescription";
import { DEBOUNCE_MS } from "../utils/constants";
import { getPromptModelName } from "../utils/promptUtils";

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
  setConfigDescription: (description: string) => Promise<void>;
  setConfigName: (name: string) => Promise<void>;
  setParameters: (parameters: JSONObject, promptName?: string) => Promise<void>;
  updateModel: (value: {
    modelName?: string;
    settings?: InferenceSettings;
    promptName?: string;
  }) => Promise<{ aiconfig: AIConfig }>;
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

  const saveCallback = callbacks.save;
  const onSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveCallback(clientConfigToAIConfig(stateRef.current));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : null;
      showNotification({
        title: "Error saving",
        message,
        color: "red",
      });
    } finally {
      setIsSaving(false);
    }
  }, [saveCallback]);

  const updatePromptCallback = callbacks.updatePrompt;
  const debouncedUpdatePrompt = useMemo(
    () =>
      debounce(
        async (
          promptName: string,
          newPrompt: Prompt,
          resFn?: (aiconfigRes: AIConfig) => void
        ) => {
          const serverConfigRes = await updatePromptCallback(
            promptName,
            newPrompt
          );
          if (serverConfigRes && resFn) {
            resFn(serverConfigRes.aiconfig);
          }
        },
        DEBOUNCE_MS
      ),
    [updatePromptCallback]
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
        const statePrompt = getPrompt(stateRef.current, promptId);
        if (!statePrompt) {
          throw new Error(`Could not find prompt with id ${promptId}`);
        }
        const prompt = clientPromptToAIConfigPrompt(statePrompt);

        await debouncedUpdatePrompt(
          prompt.name,
          {
            ...prompt,
            input: newPromptInput,
          },
          (serverConfigRes) =>
            dispatch({
              type: "CONSOLIDATE_AICONFIG",
              action,
              config: serverConfigRes.aiconfig,
            })
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : null;
        showNotification({
          title: "Error updating prompt input",
          message,
          color: "red",
        });
      }
    },
    [debouncedUpdatePrompt, dispatch]
  );

  const onChangePromptName = useCallback(
    async (promptId: string, newName: string) => {
      try {
        const statePrompt = getPrompt(stateRef.current, promptId);
        if (!statePrompt) {
          throw new Error(`Could not find prompt with id ${promptId}`);
        }
        const prompt = clientPromptToAIConfigPrompt(statePrompt);

        await debouncedUpdatePrompt(
          prompt.name,
          {
            ...prompt,
            name: newName,
          },
          // PromptName component maintains local state for the name to show in the UI
          // We cannot update client config state until the name is successfully set server-side
          // or else we could end up referencing a prompt name that is not set server-side
          () =>
            dispatch({
              type: "UPDATE_PROMPT_NAME",
              id: promptId,
              name: newName,
            })
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : null;
        showNotification({
          title: "Error updating prompt name",
          message,
          color: "red",
        });
      }
    },
    [debouncedUpdatePrompt]
  );

  const updateModelCallback = callbacks.updateModel;
  const debouncedUpdateModel = useMemo(
    () =>
      debounce(
        (value: {
          modelName?: string;
          settings?: InferenceSettings;
          promptName?: string;
        }) => updateModelCallback(value),
        DEBOUNCE_MS
      ),
    [updateModelCallback]
  );

  const onUpdatePromptModelSettings = useCallback(
    async (promptId: string, newModelSettings: JSONObject) => {
      dispatch({
        type: "UPDATE_PROMPT_MODEL_SETTINGS",
        id: promptId,
        modelSettings: newModelSettings,
      });

      try {
        const statePrompt = getPrompt(stateRef.current, promptId);
        if (!statePrompt) {
          throw new Error(`Could not find prompt with id ${promptId}`);
        }
        const modelName = getPromptModelName(statePrompt);
        if (!modelName) {
          throw new Error(`Could not find model name for prompt ${promptId}`);
        }
        await debouncedUpdateModel({
          modelName,
          settings: newModelSettings as InferenceSettings,
          promptName: statePrompt.name,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : null;
        showNotification({
          title: "Error updating prompt model settings",
          message,
          color: "red",
        });
      }
    },
    [debouncedUpdateModel, dispatch]
  );

  const onUpdatePromptModel = useCallback(
    async (promptId: string, newModel?: string) => {
      dispatch({
        type: "UPDATE_PROMPT_MODEL",
        id: promptId,
        modelName: newModel,
      });

      try {
        const statePrompt = getPrompt(stateRef.current, promptId);
        if (!statePrompt) {
          throw new Error(`Could not find prompt with id ${promptId}`);
        }

        await debouncedUpdateModel({
          modelName: newModel,
          promptName: statePrompt.name,
        });

        // TODO: Consolidate
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : null;
        showNotification({
          title: "Error updating prompt model",
          message,
          color: "red",
        });
      }
    },
    [dispatch, debouncedUpdateModel]
  );

  const setParametersCallback = callbacks.setParameters;
  const debouncedSetParameters = useMemo(
    () =>
      debounce(
        (parameters: JSONObject, promptName?: string) =>
          setParametersCallback(parameters, promptName),
        DEBOUNCE_MS
      ),
    [setParametersCallback]
  );

  const onUpdateGlobalParameters = useCallback(
    async (newParameters: JSONObject) => {
      dispatch({
        type: "UPDATE_GLOBAL_PARAMETERS",
        parameters: newParameters,
      });

      try {
        await debouncedSetParameters(newParameters);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : null;
        showNotification({
          title: "Error setting global parameters",
          message: message,
          color: "red",
        });
      }
    },
    [debouncedSetParameters, dispatch]
  );

  const onUpdatePromptParameters = useCallback(
    async (promptId: string, newParameters: JSONObject) => {
      dispatch({
        type: "UPDATE_PROMPT_PARAMETERS",
        id: promptId,
        parameters: newParameters,
      });

      try {
        const statePrompt = getPrompt(stateRef.current, promptId);
        if (!statePrompt) {
          throw new Error(`Could not find prompt with id ${promptId}`);
        }
        await debouncedSetParameters(newParameters, statePrompt.name);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : null;
        const promptIdentifier =
          getPrompt(stateRef.current, promptId)?.name ?? promptId;
        showNotification({
          title: `Error setting parameters for prompt ${promptIdentifier}`,
          message: message,
          color: "red",
        });
      }
    },
    [debouncedSetParameters, dispatch]
  );

  const addPromptCallback = callbacks.addPrompt;
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
        const serverConfigRes = await addPromptCallback(
          promptName,
          newPrompt,
          promptIndex
        );
        dispatch({
          type: "CONSOLIDATE_AICONFIG",
          action,
          config: serverConfigRes.aiconfig,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : null;
        showNotification({
          title: "Error adding prompt to config",
          message: message,
          color: "red",
        });
      }
    },
    [addPromptCallback, dispatch]
  );

  const deletePromptCallback = callbacks.deletePrompt;
  const onDeletePrompt = useCallback(
    async (promptId: string) => {
      dispatch({
        type: "DELETE_PROMPT",
        id: promptId,
      });

      try {
        const prompt = getPrompt(stateRef.current, promptId);
        if (!prompt) {
          throw new Error(`Could not find prompt with id ${promptId}`);
        }
        await deletePromptCallback(prompt.name);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : null;
        showNotification({
          title: "Error deleting prompt",
          message,
          color: "red",
        });
      }
    },
    [deletePromptCallback, dispatch]
  );

  const runPromptCallback = callbacks.runPrompt;
  const onRunPrompt = useCallback(
    async (promptId: string) => {
      const action: AIConfigReducerAction = {
        type: "RUN_PROMPT",
        id: promptId,
      };

      dispatch(action);

      try {
        const statePrompt = getPrompt(stateRef.current, promptId);
        if (!statePrompt) {
          throw new Error(`Could not find prompt with id ${promptId}`);
        }
        const promptName = statePrompt.name;
        const serverConfigRes = await runPromptCallback(promptName);

        dispatch({
          type: "CONSOLIDATE_AICONFIG",
          action,
          config: serverConfigRes.aiconfig,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : null;
        showNotification({
          title: "Error running prompt",
          message,
          color: "red",
        });
      }
    },
    [runPromptCallback]
  );

  const setNameCallback = callbacks.setConfigName;
  const debouncedSetName = useMemo(
    () => debounce((name: string) => setNameCallback(name), DEBOUNCE_MS),
    [setNameCallback]
  );

  const onSetName = useCallback(
    async (name: string) => {
      dispatch({
        type: "SET_NAME",
        name,
      });
      try {
        await debouncedSetName(name);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : null;
        showNotification({
          title: "Error setting config name",
          message,
          color: "red",
        });
      }
    },
    [debouncedSetName]
  );

  const setDescriptionCallback = callbacks.setConfigDescription;
  const debouncedSetDescription = useMemo(
    () =>
      debounce(
        (description: string) => setDescriptionCallback(description),
        DEBOUNCE_MS
      ),
    [setDescriptionCallback]
  );

  const onSetDescription = useCallback(
    async (description: string) => {
      dispatch({
        type: "SET_DESCRIPTION",
        description,
      });

      try {
        await debouncedSetDescription(description);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : null;
        showNotification({
          title: "Error setting config description",
          message,
          color: "red",
        });
      }
    },
    [debouncedSetDescription]
  );

  const { classes } = useStyles();

  const getState = useCallback(() => stateRef.current, []);
  const contextValue = useMemo(
    () => ({
      getState,
    }),
    [getState]
  );

  return (
    <AIConfigContext.Provider value={contextValue}>
      <Container maw="80rem">
        <Flex justify="flex-end" mt="md" mb="xs">
          <Button loading={isSaving} onClick={onSave}>
            Save
          </Button>
        </Flex>
        <ConfigNameDescription
          name={aiconfigState.name}
          description={aiconfigState.description}
          setDescription={onSetDescription}
          setName={onSetName}
        />
      </Container>
      <GlobalParametersContainer
        initialValue={aiconfigState?.metadata?.parameters ?? {}}
        onUpdateParameters={onUpdateGlobalParameters}
      />
      <Container maw="80rem" className={classes.promptsContainer}>
        <div className={classes.addPromptRow}>
          <AddPromptButton
            getModels={callbacks.getModels}
            addPrompt={(model: string) => onAddPrompt(0, model)}
          />
        </div>
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
    </AIConfigContext.Provider>
  );
}
