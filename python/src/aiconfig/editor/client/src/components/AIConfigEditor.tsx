import {
  Container,
  Button,
  Flex,
  Text,
  Tooltip,
  Alert,
  Group,
} from "@mantine/core";
import { Notifications, showNotification } from "@mantine/notifications";
import {
  AIConfig,
  InferenceSettings,
  JSONObject,
  Output,
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
import { v4 as uuidv4 } from "uuid";
import aiconfigReducer from "../reducers/aiconfigReducer";
import type { AIConfigReducerAction } from "../reducers/actions";
import {
  AIConfigEditorMode,
  LogEvent,
  LogEventData,
  aiConfigToClientConfig,
  clientConfigToAIConfig,
  clientPromptToAIConfigPrompt,
} from "../shared/types";
import {
  getDefaultNewPromptName,
  getModelSettingsStream,
  getPrompt,
} from "../utils/aiconfigStateUtils";
import { debounce, uniqueId } from "lodash";
import GlobalParametersContainer from "./GlobalParametersContainer";
import AIConfigContext from "../contexts/AIConfigContext";
import ConfigNameDescription from "./ConfigNameDescription";
import {
  AUTOSAVE_INTERVAL_MS,
  DEBOUNCE_MS,
  SERVER_HEARTBEAT_INTERVAL_MS,
} from "../utils/constants";
import {
  getDefaultPromptInputForModel,
  getPromptModelName,
} from "../utils/promptUtils";
import { IconDeviceFloppy } from "@tabler/icons-react";
import CopyButton from "./CopyButton";
import AIConfigEditorThemeProvider from "../themes/AIConfigEditorThemeProvider";
import PromptsContainer from "./prompt/PromptsContainer";

type Props = {
  aiconfig: AIConfig;
  callbacks?: AIConfigCallbacks;
  mode?: AIConfigEditorMode;
  readOnly?: boolean;
};

export type RunPromptStreamEvent =
  | {
      type: "output_chunk";
      data: Output;
    }
  | {
      type: "aiconfig_chunk";
      data: AIConfig;
    }
  | {
      type: "stop_streaming";
      data: null;
    };

export type RunPromptStreamErrorEvent = {
  type: "error";
  data: {
    message: string;
    code: number;
    data: AIConfig;
  };
};

export type RunPromptStreamCallback = (event: RunPromptStreamEvent) => void;

export type RunPromptStreamErrorCallback = (
  event: RunPromptStreamErrorEvent
) => void;

export type AIConfigCallbacks = {
  addPrompt: (
    promptName: string,
    prompt: Prompt,
    index: number
  ) => Promise<{ aiconfig: AIConfig }>;
  clearOutputs: () => Promise<{ aiconfig: AIConfig }>;
  deletePrompt: (promptName: string) => Promise<void>;
  getModels: (search: string) => Promise<string[]>;
  getServerStatus?: () => Promise<{ status: "OK" | "ERROR" }>;
  logEventHandler?: (event: LogEvent, data?: LogEventData) => void;
  runPrompt: (
    promptName: string,
    onStream: RunPromptStreamCallback,
    onError: RunPromptStreamErrorCallback,
    enableStreaming?: boolean,
    cancellationToken?: string
  ) => Promise<{ aiconfig: AIConfig }>;
  cancel: (cancellationToken: string) => Promise<void>;
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

export default function AIConfigEditor({
  aiconfig: initialAIConfig,
  callbacks,
  mode,
  readOnly = false,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [serverStatus, setServerStatus] = useState<"OK" | "ERROR">("OK");
  const [aiconfigState, dispatch] = useReducer(
    aiconfigReducer,
    aiConfigToClientConfig(initialAIConfig)
  );

  const stateRef = useRef(aiconfigState);
  stateRef.current = aiconfigState;

  const logEventHandler = callbacks?.logEventHandler;

  const saveCallback = callbacks?.save;
  const onSave = useCallback(async () => {
    if (!saveCallback) {
      return;
    }
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

  const updatePromptCallback = callbacks?.updatePrompt;
  const debouncedUpdatePrompt = useMemo(() => {
    if (!updatePromptCallback) {
      return;
    }
    return debounce(
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
    );
  }, [updatePromptCallback]);

  const onChangePromptInput = useCallback(
    async (promptId: string, newPromptInput: PromptInput) => {
      if (!debouncedUpdatePrompt) {
        // Just no-op if no callback specified. We could technically perform
        // client-side updates but that might be confusing
        return;
      }

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
      if (!debouncedUpdatePrompt) {
        // Just no-op if no callback specified. We could technically perform
        // client-side updates but that might be confusing
        return;
      }

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

  const updateModelCallback = callbacks?.updateModel;
  const debouncedUpdateModel = useMemo(() => {
    if (!updateModelCallback) {
      return;
    }

    return debounce(
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
    );
  }, [updateModelCallback]);

  const onUpdatePromptModelSettings = useCallback(
    async (promptId: string, newModelSettings: JSONObject) => {
      if (!debouncedUpdateModel) {
        // Just no-op if no callback specified. We could technically perform
        // client-side updates but that might be confusing
        return;
      }

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
        const modelName = getPromptModelName(
          statePrompt,
          stateRef.current.metadata.default_model
        );
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
      if (!debouncedUpdateModel) {
        // Just no-op if no callback specified. We could technically perform
        // client-side updates but that might be confusing
        return;
      }

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

  const setParametersCallback = callbacks?.setParameters;
  const debouncedSetParameters = useMemo(() => {
    if (!setParametersCallback) {
      return;
    }

    return debounce(
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
    );
  }, [setParametersCallback]);

  const onUpdateGlobalParameters = useCallback(
    async (newParameters: JSONObject) => {
      if (!debouncedSetParameters) {
        // Just no-op if no callback specified. We could technically perform
        // client-side updates but that might be confusing
        return;
      }

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
      if (!debouncedSetParameters) {
        // Just no-op if no callback specified. We could technically perform
        // client-side updates but that might be confusing
        return;
      }

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

  const addPromptCallback = callbacks?.addPrompt;
  const onAddPrompt = useCallback(
    async (promptIndex: number, model: string) => {
      if (!addPromptCallback) {
        // Just no-op if no callback specified. We could technically perform
        // client-side updates but that might be confusing
        return;
      }

      const promptName = getDefaultNewPromptName(
        stateRef.current as unknown as AIConfig
      );

      const newPrompt: Prompt = {
        name: promptName,
        input: getDefaultPromptInputForModel(model),
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
      logEventHandler?.("ADD_PROMPT", { model, promptIndex });

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
    [addPromptCallback, logEventHandler]
  );

  const deletePromptCallback = callbacks?.deletePrompt;
  const onDeletePrompt = useCallback(
    async (promptId: string) => {
      if (!deletePromptCallback) {
        // Just no-op if no callback specified. We could technically perform
        // client-side updates but that might be confusing
        return;
      }

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

  const clearOutputsCallback = callbacks?.clearOutputs;
  const onClearOutputs = useCallback(async () => {
    if (!clearOutputsCallback) {
      // Just no-op if no callback specified. We could technically perform
      // client-side updates but that might be confusing
      return;
    }

    dispatch({
      type: "CLEAR_OUTPUTS",
    });
    try {
      await clearOutputsCallback();
    } catch (err: unknown) {
      const message = (err as RequestCallbackError).message ?? null;
      showNotification({
        title: "Error clearing outputs",
        message,
        color: "red",
      });
    }
  }, [clearOutputsCallback, dispatch]);

  const runPromptCallback = callbacks?.runPrompt;

  const onRunPrompt = useCallback(
    async (promptId: string) => {
      if (!runPromptCallback) {
        // Just no-op if no callback specified. We could technically perform
        // client-side updates but that might be confusing
        return;
      }

      const cancellationToken = uuidv4();

      dispatch({
        // This sets the isRunning and runningPromptId flags
        type: "RUN_PROMPT_START",
        promptId,
        cancellationToken,
      });

      const onPromptError = (message: string | null) => {
        dispatch({
          type: "RUN_PROMPT_ERROR",
          promptId,
          message: message ?? undefined,
        });

        const promptName = getPrompt(stateRef.current, promptId)?.name;

        showNotification({
          title: `Error running prompt${promptName ? ` ${promptName}` : ""}`,
          message,
          color: "red",
        });
      };

      try {
        const statePrompt = getPrompt(stateRef.current, promptId);
        if (!statePrompt) {
          throw new Error(`Could not find prompt with id ${promptId}`);
        }

        const promptName = statePrompt.name;
        const enableStreaming: boolean | undefined = getModelSettingsStream(
          statePrompt,
          stateRef.current
        );

        const serverConfigResponse = await runPromptCallback(
          promptName,
          (event) => {
            if (event.type === "output_chunk") {
              dispatch({
                type: "STREAM_OUTPUT_CHUNK",
                promptId,
                output: event.data,
              });
            } else if (event.type === "aiconfig_chunk") {
              dispatch({
                type: "STREAM_AICONFIG_CHUNK",
                config: event.data,
              });
            } else if (event.type === "stop_streaming") {
              // Pass this event at the end of streaming to signal
              // that the prompt is done running and we're ready
              // to reset the ClientAIConfig to a non-running state
              dispatch({
                type: "RUN_PROMPT_SUCCESS",
                promptId,
              });
            }
          },
          (event) => {
            console.log(
              `Error running prompt ${promptName}: ${JSON.stringify(event)}`
            );
            if (event.type === "error") {
              if (event.data.code === 499) {
                // This is a cancellation
                // Reset the aiconfig to the state before we started running the prompt
                dispatch({
                  type: "RUN_PROMPT_CANCEL",
                  promptId,
                  // Returned config output is reset to before running RUN_PROMPT
                  config: event.data.data,
                });

                const promptName = getPrompt(stateRef.current, promptId)?.name;

                showNotification({
                  title: `Execution interrupted for prompt${
                    promptName ? ` '${promptName}'` : ""
                  }. Resetting output to previous state.`,
                  message: event.data.message,
                  color: "yellow",
                });
              } else {
                onPromptError(event.data.message);
              }
            }
          },
          enableStreaming,
          cancellationToken
        );

        // Keep this here in case any server implementations don't return
        // aiconfig as a streaming format
        if (serverConfigResponse?.aiconfig) {
          dispatch({
            type: "RUN_PROMPT_SUCCESS",
            promptId,
            config: serverConfigResponse.aiconfig,
          });
        }
      } catch (err: unknown) {
        const message = (err as RequestCallbackError).message ?? null;
        onPromptError(message);
      }
    },
    [runPromptCallback]
  );

  const setNameCallback = callbacks?.setConfigName;
  const debouncedSetName = useMemo(() => {
    if (!setNameCallback) {
      return;
    }

    return debounce(async (name: string, onError: (err: unknown) => void) => {
      try {
        await setNameCallback(name);
      } catch (err: unknown) {
        onError(err);
      }
    }, DEBOUNCE_MS);
  }, [setNameCallback]);

  const onSetName = useCallback(
    async (name: string) => {
      if (!debouncedSetName) {
        // Just no-op if no callback specified. We could technically perform
        // client-side updates but that might be confusing
        return;
      }

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

  const setDescriptionCallback = callbacks?.setConfigDescription;
  const debouncedSetDescription = useMemo(() => {
    if (!setDescriptionCallback) {
      return;
    }

    return debounce(
      async (description: string, onError: (err: unknown) => void) => {
        try {
          await setDescriptionCallback(description);
        } catch (err: unknown) {
          onError(err);
        }
      },
      DEBOUNCE_MS
    );
  }, [setDescriptionCallback]);

  const onSetDescription = useCallback(
    async (description: string) => {
      if (!debouncedSetDescription) {
        // Just no-op if no callback specified. We could technically perform
        // client-side updates but that might be confusing
        return;
      }

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

  const getState = useCallback(() => stateRef.current, []);
  const contextValue = useMemo(
    () => ({
      getState,
      logEventHandler,
      readOnly,
    }),
    [getState, logEventHandler, readOnly]
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

  // Server heartbeat, check every 3s to show error if server is down
  // Don't poll if server status is in an error state since it won't automatically recover
  const getServerStatusCallback = callbacks?.getServerStatus;
  useEffect(() => {
    if (!getServerStatusCallback || serverStatus !== "OK") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await getServerStatusCallback();
        setServerStatus(res.status);
      } catch (err: unknown) {
        setServerStatus("ERROR");
      }
    }, SERVER_HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [getServerStatusCallback, serverStatus]);

  const runningPromptId: string | undefined = aiconfigState._ui.runningPromptId;

  return (
    <AIConfigEditorThemeProvider mode={mode}>
      <AIConfigContext.Provider value={contextValue}>
        <Notifications />
        <div className="editorBackground">
          {serverStatus !== "OK" && (
            <>
              {/* // Simple placeholder block div to make sure the banner does not overlap page contents until scrolling past its height */}
              <div style={{ height: "100px" }} />
              <Alert
                color="red"
                title="Server Connection Error"
                w="100%"
                style={{ position: "fixed", top: 0, zIndex: 999 }}
              >
                <Text>
                  There is a problem with the editor server connection. Please
                  copy important changes somewhere safe and then try reloading
                  the page or restarting the editor.
                </Text>
                <Flex align="center">
                  <CopyButton
                    value={JSON.stringify(
                      clientConfigToAIConfig(aiconfigState),
                      null,
                      2
                    )}
                    contentLabel="AIConfig JSON"
                  />
                  <Text color="dimmed">
                    Click to copy current AIConfig JSON
                  </Text>
                </Flex>
              </Alert>
            </>
          )}
          <Container maw="80rem">
            <Flex justify="flex-end" mt="md" mb="xs">
              <Group>
                {!readOnly && (
                  <Button
                    loading={undefined}
                    onClick={onClearOutputs}
                    size="xs"
                    variant="gradient"
                  >
                    Clear Outputs
                  </Button>
                )}
                {!readOnly && (
                  <Tooltip
                    label={
                      isDirty ? "Save changes to config" : "No unsaved changes"
                    }
                  >
                    <Button
                      leftIcon={<IconDeviceFloppy />}
                      loading={isSaving}
                      onClick={() => {
                        onSave();
                        logEventHandler?.("SAVE_BUTTON_CLICKED");
                      }}
                      disabled={!isDirty}
                      size="xs"
                      variant="gradient"
                    >
                      Save
                    </Button>
                  </Tooltip>
                )}
              </Group>
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
          <PromptsContainer
            cancelRunPrompt={callbacks?.cancel}
            defaultModel={aiconfigState.metadata.default_model}
            getModels={callbacks?.getModels}
            onAddPrompt={onAddPrompt}
            onChangePromptInput={onChangePromptInput}
            onChangePromptName={onChangePromptName}
            onDeletePrompt={onDeletePrompt}
            onRunPrompt={onRunPrompt}
            onUpdatePromptModel={onUpdatePromptModel}
            onUpdatePromptModelSettings={onUpdatePromptModelSettings}
            onUpdatePromptParameters={onUpdatePromptParameters}
            prompts={aiconfigState.prompts}
            runningPromptId={runningPromptId}
          />
        </div>
      </AIConfigContext.Provider>
    </AIConfigEditorThemeProvider>
  );
}
