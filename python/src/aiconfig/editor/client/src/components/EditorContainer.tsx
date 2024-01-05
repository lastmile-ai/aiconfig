import PromptContainer from "./prompt/PromptContainer";
import {
  Container,
  Button,
  createStyles,
  Stack,
  Flex,
  Tooltip,
} from "@mantine/core";
import { Notifications, showNotification } from "@mantine/notifications";
import {
  AIConfig,
  InferenceSettings,
  JSONObject,
  Prompt,
  PromptInput,
} from "aiconfig";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
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
import { AUTOSAVE_INTERVAL_MS, DEBOUNCE_MS } from "../utils/constants";
import { getPromptModelName } from "../utils/promptUtils";
import { IconDeviceFloppy } from "@tabler/icons-react";

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

type RequestCallbackError = { message?: string };

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
      dispatch({
        type: "SAVE_CONFIG_SUCCESS",
      });
    } catch (err: unknown) {
      const message = (err as RequestCallbackError).message ?? null;
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
          onSuccess: (aiconfigRes: AIConfig) => void,
          onError: (err: unknown) => void
        ) => {
          try {
            const serverConfigRes = await updatePromptCallback(
              promptName,
              newPrompt
            );
            if (serverConfigRes?.aiconfig) {
              onSuccess(serverConfigRes.aiconfig);
            }
          } catch (err: unknown) {
            onError(err);
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

      const onError = (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error updating prompt input",
          message,
          color: "red",
        });
      };

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
          (config) =>
            dispatch({
              type: "CONSOLIDATE_AICONFIG",
              action,
              config,
            }),
          onError
        );
      } catch (err: unknown) {
        onError(err);
      }
    },
    [debouncedUpdatePrompt, dispatch]
  );

  const onChangePromptName = useCallback(
    async (promptId: string, newName: string) => {
      const onError = (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error updating prompt name",
          message,
          color: "red",
        });
      };

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
            }),
          onError
        );
      } catch (err: unknown) {
        onError(err);
      }
    },
    [debouncedUpdatePrompt]
  );

  const updateModelCallback = callbacks.updateModel;
  const debouncedUpdateModel = useMemo(
    () =>
      debounce(
        async (
          value: {
            modelName?: string;
            settings?: InferenceSettings;
            promptName?: string;
          },
          onError: (err: unknown) => void
        ) => {
          try {
            await updateModelCallback(value);
          } catch (err: unknown) {
            onError(err);
          }
        },
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

      const onError = (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error updating prompt model settings",
          message,
          color: "red",
        });
      };

      try {
        const statePrompt = getPrompt(stateRef.current, promptId);
        if (!statePrompt) {
          throw new Error(`Could not find prompt with id ${promptId}`);
        }
        const modelName = getPromptModelName(statePrompt);
        if (!modelName) {
          throw new Error(`Could not find model name for prompt ${promptId}`);
        }
        await debouncedUpdateModel(
          {
            modelName,
            settings: newModelSettings as InferenceSettings,
            promptName: statePrompt.name,
          },
          onError
        );
      } catch (err: unknown) {
        onError(err);
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

      const onError = (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error updating model for prompt",
          message,
          color: "red",
        });
      };

      try {
        const statePrompt = getPrompt(stateRef.current, promptId);
        if (!statePrompt) {
          throw new Error(`Could not find prompt with id ${promptId}`);
        }

        await debouncedUpdateModel(
          {
            modelName: newModel,
            promptName: statePrompt.name,
          },
          onError
        );
      } catch (err: unknown) {
        onError(err);
      }
    },
    [dispatch, debouncedUpdateModel]
  );

  const setParametersCallback = callbacks.setParameters;
  const debouncedSetParameters = useMemo(
    () =>
      debounce(
        async (
          parameters: JSONObject,
          promptName?: string,
          onError?: (err: unknown) => void
        ) => {
          try {
            await setParametersCallback(parameters, promptName);
          } catch (err: unknown) {
            onError?.(err);
          }
        },
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

      const onError = (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error setting global parameters",
          message: message,
          color: "red",
        });
      };

      try {
        await debouncedSetParameters(
          newParameters,
          undefined /* promptName */,
          onError
        );
      } catch (err: unknown) {
        onError(err);
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

      const onError = (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        const promptIdentifier =
          getPrompt(stateRef.current, promptId)?.name ?? promptId;
        showNotification({
          title: `Error setting parameters for prompt ${promptIdentifier}`,
          message: message,
          color: "red",
        });
      };

      try {
        const statePrompt = getPrompt(stateRef.current, promptId);
        if (!statePrompt) {
          throw new Error(`Could not find prompt with id ${promptId}`);
        }
        await debouncedSetParameters(newParameters, statePrompt.name, onError);
      } catch (err: unknown) {
        onError(err);
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
        const message = (err as RequestCallbackError).message ?? null;
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
        const message = (err as RequestCallbackError).message ?? null;
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
        const message = (err as RequestCallbackError).message ?? null;

        // TODO: Add ErrorOutput component to show error instead of notification
        dispatch({
          type: "RUN_PROMPT_ERROR",
          id: promptId,
          message: message ?? undefined,
        });

        const promptName = getPrompt(stateRef.current, promptId)?.name;

        showNotification({
          title: `Error running prompt${promptName ? ` ${promptName}` : ""}`,
          message,
          color: "red",
        });
      }
    },
    [runPromptCallback]
  );

  const setNameCallback = callbacks.setConfigName;
  const debouncedSetName = useMemo(
    () =>
      debounce(async (name: string, onError: (err: unknown) => void) => {
        try {
          await setNameCallback(name);
        } catch (err: unknown) {
          onError(err);
        }
      }, DEBOUNCE_MS),
    [setNameCallback]
  );

  const onSetName = useCallback(
    async (name: string) => {
      dispatch({
        type: "SET_NAME",
        name,
      });

      await debouncedSetName(name, (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error setting config name",
          message,
          color: "red",
        });
      });
    },
    [debouncedSetName]
  );

  const setDescriptionCallback = callbacks.setConfigDescription;
  const debouncedSetDescription = useMemo(
    () =>
      debounce(async (description: string, onError: (err: unknown) => void) => {
        try {
          await setDescriptionCallback(description);
        } catch (err: unknown) {
          onError(err);
        }
      }, DEBOUNCE_MS),
    [setDescriptionCallback]
  );

  const onSetDescription = useCallback(
    async (description: string) => {
      dispatch({
        type: "SET_DESCRIPTION",
        description,
      });

      await debouncedSetDescription(description, (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error setting config description",
          message,
          color: "red",
        });
      });
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

  const isDirty = aiconfigState._ui.isDirty !== false;
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    // Save every 15 seconds if there are unsaved changes
    const saveInterval = setInterval(onSave, AUTOSAVE_INTERVAL_MS);

    return () => clearInterval(saveInterval);
  }, [isDirty, onSave]);

  // Override CMD+s and CTRL+s to save
  useEffect(() => {
    const saveHandler = (e: KeyboardEvent) => {
      // Note platform property to distinguish between CMD and CTRL for
      // Mac/Windows/Linux is deprecated.
      // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform
      // Just handle both for now.
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();

        if (stateRef.current._ui.isDirty) {
          onSave();
        }
      }
    };

    window.addEventListener("keydown", saveHandler, false);

    return () => window.removeEventListener("keydown", saveHandler);
  }, [onSave]);

  return (
    <AIConfigContext.Provider value={contextValue}>
      <Notifications />
      <Container maw="80rem">
        <Flex justify="flex-end" mt="md" mb="xs">
          <Tooltip
            label={isDirty ? "Save changes to config" : "No unsaved changes"}
          >
            <div>
              <Button
                leftIcon={<IconDeviceFloppy />}
                loading={isSaving}
                onClick={onSave}
                disabled={!isDirty}
              >
                Save
              </Button>
            </div>
          </Tooltip>
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
