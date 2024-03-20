import {
  Container,
  Button,
  Flex,
  Text,
  Tooltip,
  Alert,
  Group,
  ActionIcon,
  MantineThemeOverride,
} from "@mantine/core";
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
  useContext,
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
  ThemeMode,
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
import { IconBraces, IconDeviceFloppy } from "@tabler/icons-react";
import CopyButton from "./CopyButton";
import AIConfigEditorThemeProvider from "../themes/AIConfigEditorThemeProvider";
import DownloadButton from "./global/DownloadButton";
import ShareButton from "./global/ShareButton";
import PromptsContainer from "./prompt/PromptsContainer";
import NotificationProvider, {
  AIConfigEditorNotification,
} from "./notifications/NotificationProvider";
import NotificationContext from "./notifications/NotificationContext";
import ConfigMetadataContainer from "./global/ConfigMetadataContainer";

type Props = {
  aiconfig: AIConfig;
  callbacks?: AIConfigCallbacks;
  mode?: AIConfigEditorMode;
  readOnly?: boolean;
  /**
   * Theme mode override for the editor. By default, the editor will use the system
   * theme variant for the theme associated with the EditorMode. This prop allows
   * overriding that behavior.
   */
  themeMode?: ThemeMode;
  /**
   * Theme override for the editor. If provided, this will override the theme associated
   * with the provided AIConfigEditorMode.
   */
  themeOverride?: MantineThemeOverride;
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
  cancel: (cancellationToken: string) => Promise<void>;
  clearOutputs: () => Promise<{ aiconfig: AIConfig }>;
  deleteOutput: (promptName: string) => Promise<{ aiconfig: AIConfig }>;
  deleteModelSettings?: (modelName: string) => Promise<void>;
  deletePrompt: (promptName: string) => Promise<void>;
  download?: () => Promise<void>;
  openInTextEditor?: () => Promise<void>;
  getModels: (search?: string) => Promise<string[]>;
  getServerStatus?: () => Promise<{ status: "OK" | "ERROR" }>;
  logEventHandler?: (event: LogEvent, data?: LogEventData) => void;
  runPrompt: (
    promptName: string,
    onStream: RunPromptStreamCallback,
    onError: RunPromptStreamErrorCallback,
    enableStreaming?: boolean,
    cancellationToken?: string
  ) => Promise<{ aiconfig: AIConfig }>;
  save?: (aiconfig: AIConfig) => Promise<void>;
  setConfigDescription: (description: string) => Promise<void>;
  setConfigName: (name: string) => Promise<void>;
  setParameters: (parameters: JSONObject, promptName?: string) => Promise<void>;
  share?: () => Promise<{ share_url: string }>;
  showNotification?: (notification: AIConfigEditorNotification) => void;
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

function AIConfigEditorBase({
  aiconfig: providedAIConfig,
  callbacks,
  mode,
  readOnly = false,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [serverStatus, setServerStatus] = useState<"OK" | "ERROR">("OK");
  const [aiconfigState, dispatch] = useReducer(
    aiconfigReducer,
    aiConfigToClientConfig(providedAIConfig)
  );

  const [prevProvidedConfig, setPrevProvidedConfig] =
    useState<AIConfig>(providedAIConfig);
  // After initializing the aiconfigState, we should also support updating the
  // state if the provided AIConfig changes externally
  if (prevProvidedConfig !== providedAIConfig) {
    setPrevProvidedConfig(providedAIConfig);
    dispatch({
      type: "PROVIDED_AICONFIG_UPDATE",
      config: providedAIConfig,
    });
  }

  const { showNotification } = useContext(NotificationContext);

  const stateRef = useRef(aiconfigState);
  stateRef.current = aiconfigState;

  const logEventHandler = callbacks?.logEventHandler;

  const downloadCallback = callbacks?.download;
  const openInTextEditorCallback = callbacks?.openInTextEditor;
  const onDownload = useCallback(async () => {
    if (!downloadCallback) {
      return;
    }
    try {
      await downloadCallback();
      logEventHandler?.("DOWNLOAD_BUTTON_CLICKED");
    } catch (err: unknown) {
      const message = (err as RequestCallbackError).message ?? null;
      showNotification({
        title: "Error downloading AIConfig",
        message,
        type: "error",
      });
    }
  }, [downloadCallback, logEventHandler, showNotification]);

  const shareCallback = callbacks?.share;
  const onShare = useCallback(async () => {
    if (!shareCallback) {
      return;
    }
    try {
      const { share_url: shareUrl } = await shareCallback();
      logEventHandler?.("SHARE_BUTTON_CLICKED");
      return shareUrl;
    } catch (err: unknown) {
      const message = (err as RequestCallbackError).message ?? null;
      showNotification({
        title: "Error sharing AIConfig",
        message,
        type: "error",
      });
    }
  }, [logEventHandler, shareCallback, showNotification]);

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
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [saveCallback, showNotification]);

  const updatePromptCallback = callbacks?.updatePrompt;
  const debouncedUpdatePrompt = useMemo(() => {
    if (!updatePromptCallback) {
      return;
    }
    return debounce(
      async (
        promptName: string,
        newPrompt: Prompt,
        callbacks: {
          onSuccess?: (aiconfigRes: AIConfig) => void;
          onError?: (err: unknown) => void;
        }
      ) => {
        try {
          const serverConfigRes = await updatePromptCallback(
            promptName,
            newPrompt
          );
          if (serverConfigRes?.aiconfig) {
            callbacks?.onSuccess?.(serverConfigRes.aiconfig);
          }
        } catch (err: unknown) {
          callbacks?.onError?.(err);
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
      logEventHandler?.("UPDATE_PROMPT_INPUT");

      const onError = (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error updating prompt input",
          message,
          type: "error",
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
          {
            onSuccess: (config) =>
              dispatch({
                type: "CONSOLIDATE_AICONFIG",
                action,
                config,
              }),
            onError,
          }
        );
      } catch (err: unknown) {
        onError(err);
      }
    },
    [debouncedUpdatePrompt, dispatch, logEventHandler, showNotification]
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
          type: "error",
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
          {
            onSuccess: () => {
              dispatch({
                type: "UPDATE_PROMPT_NAME",
                id: promptId,
                name: newName,
              });
              logEventHandler?.("UPDATE_PROMPT_NAME");
            },
            onError,
          }
        );
      } catch (err: unknown) {
        onError(err);
      }
    },
    [debouncedUpdatePrompt, logEventHandler, showNotification]
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

  const onUpdatePromptMetadata = useCallback(
    async (promptId: string, newMetadata: JSONObject) => {
      if (!debouncedUpdatePrompt) {
        // Just no-op if no callback specified. We could technically perform
        // client-side updates but that might be confusing
        return;
      }

      dispatch({
        type: "UPDATE_PROMPT_METADATA",
        id: promptId,
        metadata: newMetadata,
      });

      const onError = (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error updating prompt metadata",
          message,
          type: "error",
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
            metadata: {
              ...newMetadata,
              model: prompt.metadata?.model,
              parameters: prompt.metadata?.parameters,
            },
          },
          {
            onError,
          }
        );
      } catch (err: unknown) {
        onError(err);
      }
    },
    [debouncedUpdatePrompt, showNotification]
  );

  const deleteModelSettingsCallback = callbacks?.deleteModelSettings;
  const onDeleteGlobalModelSettings = useCallback(
    async (modelName: string) => {
      if (!deleteModelSettingsCallback) {
        return;
      }

      dispatch({
        type: "DELETE_GLOBAL_MODEL_SETTINGS",
        modelName,
      });
      logEventHandler?.("DELETE_GLOBAL_MODEL_SETTINGS", { model: modelName });

      try {
        await deleteModelSettingsCallback(modelName);
      } catch (err: unknown) {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error deleting global model settings",
          message: message,
          type: "error",
        });
      }
    },
    [deleteModelSettingsCallback, logEventHandler, showNotification]
  );

  const onUpdateGlobalModelSettings = useCallback(
    async (modelName: string, newModelSettings: JSONObject) => {
      if (!debouncedUpdateModel) {
        // Just no-op if no callback specified. We could technically perform
        // client-side updates but that might be confusing
        return;
      }

      dispatch({
        type: "UPDATE_GLOBAL_MODEL_SETTINGS",
        modelName,
        modelSettings: newModelSettings,
      });
      logEventHandler?.("UPDATE_GLOBAL_MODEL_SETTINGS", { model: modelName });

      const onError = (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error updating global model settings",
          message,
          type: "error",
        });
      };

      try {
        await debouncedUpdateModel(
          {
            modelName,
            settings: newModelSettings as InferenceSettings,
          },
          onError
        );
      } catch (err: unknown) {
        onError(err);
      }
    },
    [debouncedUpdateModel, logEventHandler, showNotification]
  );

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
      logEventHandler?.("UPDATE_PROMPT_MODEL_SETTINGS");

      const onError = (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error updating prompt model settings",
          message,
          type: "error",
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
    [debouncedUpdateModel, dispatch, logEventHandler, showNotification]
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
      logEventHandler?.("UPDATE_PROMPT_MODEL", { model: newModel });

      const onError = (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error updating model for prompt",
          message,
          type: "error",
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
    [dispatch, debouncedUpdateModel, logEventHandler, showNotification]
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
      logEventHandler?.("UPDATE_GLOBAL_PARAMETERS");

      const onError = (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error setting global parameters",
          message: message,
          type: "error",
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
    [debouncedSetParameters, dispatch, logEventHandler, showNotification]
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
      logEventHandler?.("UPDATE_PROMPT_PARAMETERS");

      const onError = (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        const promptIdentifier =
          getPrompt(stateRef.current, promptId)?.name ?? promptId;
        showNotification({
          title: `Error setting parameters for prompt ${promptIdentifier}`,
          message: message,
          type: "error",
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
    [debouncedSetParameters, dispatch, logEventHandler, showNotification]
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
          type: "error",
        });
      }
    },
    [addPromptCallback, logEventHandler, showNotification]
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
      logEventHandler?.("DELETE_PROMPT");

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
          type: "error",
        });
      }
    },
    [deletePromptCallback, dispatch, logEventHandler, showNotification]
  );

  const deleteOutputCallback = callbacks?.deleteOutput;
  const onDeleteOutput = useCallback(
    async (promptId: string) => {
      if (!deleteOutputCallback) {
        // Just no-op if no callback specified. We could technically perform
        // client-side updates but that might be confusing
        return;
      }

      dispatch({
        type: "DELETE_OUTPUT",
        id: promptId,
      });
      logEventHandler?.("DELETE_OUTPUT");

      try {
        const prompt = getPrompt(stateRef.current, promptId);
        if (!prompt) {
          throw new Error(`Could not find prompt with id ${promptId}`);
        }
        await deleteOutputCallback(prompt.name);
      } catch (err: unknown) {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error deleting output for prompt",
          message,
          type: "error",
        });
      }
    },
    [deleteOutputCallback, dispatch, logEventHandler, showNotification]
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
    logEventHandler?.("CLEAR_OUTPUTS");

    try {
      await clearOutputsCallback();
    } catch (err: unknown) {
      const message = (err as RequestCallbackError).message ?? null;
      showNotification({
        title: "Error clearing outputs",
        message,
        type: "error",
      });
    }
  }, [clearOutputsCallback, dispatch, logEventHandler, showNotification]);

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
      logEventHandler?.("RUN_PROMPT_START");

      const onPromptError = (message: string | null) => {
        dispatch({
          type: "RUN_PROMPT_ERROR",
          promptId,
          message: message ?? undefined,
        });
        logEventHandler?.("RUN_PROMPT_ERROR");

        const promptName = getPrompt(stateRef.current, promptId)?.name;

        showNotification({
          title: `Error running prompt${promptName ? ` ${promptName}` : ""}`,
          message,
          type: "error",
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
              logEventHandler?.("RUN_PROMPT_SUCCESS");
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
                logEventHandler?.("RUN_PROMPT_CANCELED");

                const promptName = getPrompt(stateRef.current, promptId)?.name;

                showNotification({
                  title: `Execution interrupted for prompt${
                    promptName ? ` '${promptName}'` : ""
                  }. Resetting output to previous state.`,
                  message: event.data.message,
                  type: "warning",
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
          // Do we need to log here
          dispatch({
            type: "RUN_PROMPT_SUCCESS",
            promptId,
            config: serverConfigResponse.aiconfig,
          });
          logEventHandler?.("RUN_PROMPT_SUCCESS");
        }
      } catch (err: unknown) {
        const message = (err as RequestCallbackError).message ?? null;
        onPromptError(message);
      }
    },
    [logEventHandler, runPromptCallback, showNotification]
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
      logEventHandler?.("SET_NAME");

      await debouncedSetName(name, (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error setting config name",
          message,
          type: "error",
        });
      });
    },
    [debouncedSetName, logEventHandler, showNotification]
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
      logEventHandler?.("SET_DESCRIPTION");

      await debouncedSetDescription(description, (err: unknown) => {
        const message = (err as RequestCallbackError).message ?? null;
        showNotification({
          title: "Error setting config description",
          message,
          type: "error",
        });
      });
    },
    [debouncedSetDescription, logEventHandler, showNotification]
  );

  const getState = useCallback(() => stateRef.current, []);
  const contextValue = useMemo(
    () => ({
      getState,
      logEventHandler,
      mode,
      readOnly,
    }),
    [getState, logEventHandler, mode, readOnly]
  );

  const isDirty = aiconfigState._ui.isDirty !== false;
  useEffect(() => {
    if (!isDirty || !saveCallback) {
      return;
    }

    // Save every 15 seconds if there are unsaved changes
    const saveInterval = setInterval(onSave, AUTOSAVE_INTERVAL_MS);

    return () => clearInterval(saveInterval);
  }, [isDirty, onSave, saveCallback]);

  // Override CMD+s and CTRL+s to save
  useEffect(() => {
    if (!saveCallback) {
      return;
    }

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
  }, [onSave, saveCallback]);

  // Server heartbeat, check every 3s to show error if server is down
  // Don't poll if server status is in an error state since it won't automatically recover
  const getServerStatusCallback = callbacks?.getServerStatus;
  useEffect(() => {
    if (readOnly || !getServerStatusCallback || serverStatus !== "OK") {
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
  }, [getServerStatusCallback, readOnly, serverStatus]);

  const runningPromptId: string | undefined = aiconfigState._ui.runningPromptId;

  return (
    <AIConfigContext.Provider value={contextValue}>
      <Container className="editorBackground" maw="80rem">
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
                copy important changes somewhere safe and then try reloading the
                page or restarting the editor.
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
                <Text color="dimmed">Click to copy current AIConfig JSON</Text>
              </Flex>
            </Alert>
          </>
        )}
        <div>
          <Flex justify="flex-end" pt="md" mb="xs">
            {
              <Group spacing="xs">
                {!readOnly && onClearOutputs && (
                  <Button
                    loading={undefined}
                    onClick={onClearOutputs}
                    size="xs"
                    variant="gradient"
                  >
                    Clear Outputs
                  </Button>
                )}
                {(downloadCallback || shareCallback) && (
                  <div>
                    {downloadCallback && (
                      <DownloadButton
                        onDownload={onDownload}
                        isGrouped={shareCallback != null}
                      />
                    )}
                    {shareCallback && (
                      <ShareButton
                        onShare={onShare}
                        isGrouped={downloadCallback != null}
                      />
                    )}
                  </div>
                )}
                {openInTextEditorCallback && (
                  <Tooltip label="Open in Text Editor" withArrow>
                    <ActionIcon
                      onClick={openInTextEditorCallback}
                      className="secondaryButton"
                    >
                      <IconBraces size="1rem" />
                    </ActionIcon>
                  </Tooltip>
                )}
                {!readOnly && saveCallback && (
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
            }
          </Flex>
          <ConfigNameDescription
            name={aiconfigState.name}
            description={aiconfigState.description}
            setDescription={onSetDescription}
            setName={onSetName}
          />
        </div>
        <ConfigMetadataContainer
          getModels={callbacks?.getModels}
          metadata={aiconfigState?.metadata}
          onDeleteModelSettings={onDeleteGlobalModelSettings}
          onUpdateModelSettings={onUpdateGlobalModelSettings}
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
          onDeleteOutput={onDeleteOutput}
          onRunPrompt={onRunPrompt}
          onUpdatePromptMetadata={onUpdatePromptMetadata}
          onUpdatePromptModel={onUpdatePromptModel}
          onUpdatePromptModelSettings={onUpdatePromptModelSettings}
          onUpdatePromptParameters={onUpdatePromptParameters}
          prompts={aiconfigState.prompts}
          runningPromptId={runningPromptId}
        />
      </Container>
    </AIConfigContext.Provider>
  );
}

// Wrap the AIConfigEditorBase in the NotificationProvider to provide NotificationContext
// to the AIConfigEditorBase. Wrap both NotificationProvider and AIConfigEditorBase with
// the theme provider to ensure all components have the proper theme
export default function AIConfigEditor(props: Props) {
  return (
    <AIConfigEditorThemeProvider
      mode={props.mode}
      themeMode={props.themeMode}
      themeOverride={props.themeOverride}
    >
      <NotificationProvider
        showNotification={props.callbacks?.showNotification}
      >
        <AIConfigEditorBase {...props} />
      </NotificationProvider>
    </AIConfigEditorThemeProvider>
  );
}
