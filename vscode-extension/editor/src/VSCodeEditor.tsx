import {
  AIConfigEditor,
  AIConfigCallbacks,
  RunPromptStreamCallback,
  RunPromptStreamErrorCallback,
  RunPromptStreamErrorEvent,
  LogEvent,
  LogEventData,
  ThemeMode,
  AIConfigEditorNotification,
} from "@lastmileai/aiconfig-editor";
import { Flex, Loader, createStyles } from "@mantine/core";
import {
  AIConfig,
  InferenceSettings,
  JSONObject,
  Output,
  Prompt,
} from "aiconfig";
import yaml from "js-yaml";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ufetch } from "ufetch";
import { datadogLogs } from "@datadog/browser-logs";
import WebviewContext from "./WebviewContext";
import { ROUTE_TABLE } from "./utils/api";
import { streamingApiChain } from "./utils/oboeHelpers";
import {
  getWebviewState,
  notifyDocumentDirty,
  updateWebviewState,
} from "./utils/vscodeUtils";
import { VSCODE_THEME } from "./VSCodeTheme";
import { v4 as uuidv4 } from "uuid";

const useStyles = createStyles(() => ({
  editorBackground: {
    margin: "0 auto",
    minHeight: "100vh",
  },
}));

const MODE = "vscode";

export default function VSCodeEditor() {
  const { vscode } = useContext(WebviewContext);

  // TODO: saqadri - does this need to be wrapped in a memo?
  const webviewState = getWebviewState(vscode);

  const [aiconfig, setAIConfig] = useState<AIConfig | undefined>(
    webviewState?.aiconfigState
  );
  const [aiConfigServerUrl, setAIConfigServerUrl] = useState<string>(
    webviewState?.serverUrl ?? ""
  );

  const [themeMode, setThemeMode] = useState<ThemeMode | undefined>(
    webviewState?.theme
  );

  // Default to readOnly until we receive a message from the extension host
  // confirming it is safe to edit the content
  const [isReadOnly, setIsReadOnly] = useState<boolean>(
    webviewState?.isReadOnly ?? true
  );

  const { classes } = useStyles();

  const updateContent = useCallback(
    async (text: string) => {
      if (text != null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let updatedConfig: any = {};
        try {
          // Try parsing the string as JSON first
          updatedConfig = JSON.parse(text);
        } catch (e) {
          // If that fails, try parsing the string as YAML
          updatedConfig = yaml.load(text);
        }

        setAIConfig(updatedConfig);
        updateWebviewState(vscode, { aiconfigState: updatedConfig });
      }
    },
    [vscode]
  );

  // Register an event listener to handle messages from the extension host
  // This is how we'll receive updates to the webview's content
  // TODO: saqadri - should this be a useCallback to memoize it?
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    if (!message) {
      console.log("onMessage, MESSAGE=NULL, event=", JSON.stringify(event));
      return;
    }

    switch (message.type) {
      case "update": {
        console.log("onMessage, message=", JSON.stringify(message));
        const text = message.text;

        // Update our webview's content
        updateContent(text);
        return;
      }
      case "set_readonly_state": {
        const isReadOnlyState = message.isReadOnly;
        if (isReadOnlyState != null && isReadOnlyState !== isReadOnly) {
          setIsReadOnly(isReadOnlyState);
          updateWebviewState(vscode, { isReadOnly: isReadOnlyState });
        }
        return;
      }
      case "set_server_url": {
        console.log("onMessage, message=", JSON.stringify(message));
        const url = message.url;
        setAIConfigServerUrl(url);
        updateWebviewState(vscode, { serverUrl: url });

        // TODO: saqadri - as soon as content is updated, we have to call
        // /get endpoint so we get the latest content from the server
        return;
      }
      case "set_theme": {
        const theme = message.theme;
        setThemeMode(theme);
        updateWebviewState(vscode, { theme });
        return;
      }
      default: {
        console.log("onMessage, UNHANDLED message=", JSON.stringify(message));
        return;
      }
    }
  });

  const loadConfig = useCallback(async () => {
    const route = ROUTE_TABLE.LOAD(aiConfigServerUrl);
    const res = await ufetch.post(route, {});
    setAIConfig(res.aiconfig);
    // If we can load the config from the server, we assume it's in a good state
    setIsReadOnly(false);
    updateWebviewState(vscode, {
      aiconfigState: res.aiconfig,
      isReadOnly: false,
    });
  }, [aiConfigServerUrl, vscode]);

  useEffect(() => {
    if (aiConfigServerUrl !== "") {
      // This is less important for the first load, but when the webview gets dehydrated and rehydrated,
      // we'll get the aiConfigServerUrl from the webview state. This will trigger a reload of the config.
      loadConfig();
    }
  }, [aiConfigServerUrl, loadConfig]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // TODO: saqadri - this should be done extension host-side
  const setupTelemetryIfAllowed = useCallback(async () => {
    const isDev = (process.env.NODE_ENV ?? "development") === "development";

    // Don't enable telemetry in dev mode because hot reload will spam the logs.
    if (isDev) {
      return;
    }

    const res = await ufetch.get(
      ROUTE_TABLE.GET_AICONFIGRC(aiConfigServerUrl),
      {}
    );

    const enableTelemetry = res.allow_usage_data_sharing;
    const sessionId: string = uuidv4();

    if (enableTelemetry) {
      datadogLogs.init({
        clientToken: "pub356987caf022337989e492681d1944a8",
        env: process.env.NODE_ENV ?? "development",
        service: "vscode-aiconfig",
        site: "us5.datadoghq.com",
        forwardErrorsToLogs: true,
        sessionSampleRate: 100,
      });

      datadogLogs.setGlobalContextProperty("mode", MODE);
      datadogLogs.setGlobalContextProperty("session_id_internal", sessionId);
    }
  }, [aiConfigServerUrl]);

  useEffect(() => {
    setupTelemetryIfAllowed();
  }, [setupTelemetryIfAllowed]);

  const getModels = useCallback(
    async (search?: string) => {
      // For now, rely on caching and handle client-side search filtering
      // We will use server-side search filtering for Gradio
      const res = await ufetch.get(ROUTE_TABLE.LIST_MODELS(aiConfigServerUrl));
      const models = res.data;
      if (search && search.length > 0) {
        const lowerCaseSearch = search.toLowerCase();
        return models.filter(
          (model: string) =>
            model.toLocaleLowerCase().indexOf(lowerCaseSearch) >= 0
        );
      }
      return models;
    },
    [aiConfigServerUrl]
  );

  const addPrompt = useCallback(
    async (promptName: string, promptData: Prompt, index: number) => {
      const res = await ufetch.post(ROUTE_TABLE.ADD_PROMPT(aiConfigServerUrl), {
        prompt_name: promptName,
        prompt_data: promptData,
        index,
      });

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const deleteModelSettings = useCallback(
    async (modelName: string) => {
      const res = await ufetch.post(
        ROUTE_TABLE.DELETE_MODEL(aiConfigServerUrl),
        {
          model_name: modelName,
        }
      );

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const deletePrompt = useCallback(
    async (promptName: string) => {
      const res = await ufetch.post(
        ROUTE_TABLE.DELETE_PROMPT(aiConfigServerUrl),
        {
          prompt_name: promptName,
        }
      );

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const clearOutputs = useCallback(async () => {
    const res = await ufetch.post(
      ROUTE_TABLE.CLEAR_OUTPUTS(aiConfigServerUrl),
      {}
    );

    if (vscode) {
      notifyDocumentDirty(vscode);
    }

    return res;
  }, [aiConfigServerUrl, vscode]);

  const deleteOutput = useCallback(
    async (promptName: string) => {
      const res = await ufetch.post(
        ROUTE_TABLE.DELETE_OUTPUT(aiConfigServerUrl),
        {
          prompt_name: promptName,
        }
      );

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const runPrompt = useCallback(
    async (
      promptName: string,
      onStream: RunPromptStreamCallback,
      onError: RunPromptStreamErrorCallback,
      enableStreaming: boolean = true,
      cancellationToken?: string
    ) => {
      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      // Note: We run the streaming API even for
      // non-streaming runs so that we can unify
      // the way we process data on the client
      const res = await streamingApiChain<{ aiconfig: AIConfig }>(
        {
          url: ROUTE_TABLE.RUN_PROMPT(aiConfigServerUrl),
          method: "POST",
          body: {
            prompt_name: promptName,
            stream: enableStreaming,
            cancellation_token_id: cancellationToken,
          },
        },
        {
          output_chunk: (data) => {
            onStream({ type: "output_chunk", data: data as Output });
            // Don't notify dirty since output chunks are very frequent
          },
          aiconfig_chunk: (data) => {
            onStream({ type: "aiconfig_chunk", data: data as AIConfig });
            if (vscode) {
              notifyDocumentDirty(vscode);
            }
          },
          stop_streaming: (_data) => {
            onStream({ type: "stop_streaming", data: null });
            if (vscode) {
              notifyDocumentDirty(vscode);
            }
          },
          error: (data) => {
            onError({
              type: "error",
              data: data as RunPromptStreamErrorEvent["data"],
            });
            if (vscode) {
              notifyDocumentDirty(vscode);
            }
          },
        }
      );

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const cancel = useCallback(
    async (cancellationToken: string) => {
      // TODO: saqadri - check the status of the response (can be 400 or 422 if cancellation fails)
      await ufetch.post(ROUTE_TABLE.CANCEL(aiConfigServerUrl), {
        cancellation_token_id: cancellationToken,
      });

      if (vscode) {
        notifyDocumentDirty(vscode);
      }
    },
    [aiConfigServerUrl, vscode]
  );

  const updatePrompt = useCallback(
    async (promptName: string, promptData: Prompt) => {
      const res = await ufetch.post(
        ROUTE_TABLE.UPDATE_PROMPT(aiConfigServerUrl),
        {
          prompt_name: promptName,
          prompt_data: promptData,
        }
      );

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const updateModel = useCallback(
    async (value: {
      modelName?: string;
      settings?: InferenceSettings;
      promptName?: string;
    }) => {
      const res = await ufetch.post(
        ROUTE_TABLE.UPDATE_MODEL(aiConfigServerUrl),
        {
          model_name: value.modelName,
          settings: value.settings,
          prompt_name: value.promptName,
        }
      );

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const setConfigName = useCallback(
    async (name: string) => {
      const res = await ufetch.post(ROUTE_TABLE.SET_NAME(aiConfigServerUrl), {
        name,
      });

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const setConfigDescription = useCallback(
    async (description: string) => {
      const res = await ufetch.post(
        ROUTE_TABLE.SET_DESCRIPTION(aiConfigServerUrl),
        {
          description,
        }
      );

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const setParameters = useCallback(
    async (parameters: JSONObject, promptName?: string) => {
      const res = await ufetch.post(
        ROUTE_TABLE.SET_PARAMETERS(aiConfigServerUrl),
        {
          parameters,
          prompt_name: promptName,
        }
      );

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const getServerStatus = useCallback(async () => {
    return await ufetch.get(ROUTE_TABLE.SERVER_STATUS(aiConfigServerUrl));
  }, [aiConfigServerUrl]);

  const logEventHandler = useCallback(
    (event: LogEvent, data?: LogEventData) => {
      try {
        datadogLogs.logger.info(event, data);
      } catch (e) {
        // Ignore logger errors for now
      }
    },
    []
  );

  const openInTextEditor = useCallback(async () => {
    vscode?.postMessage({ type: "open_in_text_editor" });
  }, [vscode]);

  const showNotification = useCallback(
    (notification: AIConfigEditorNotification) =>
      vscode?.postMessage({ type: "show_notification", notification }),
    [vscode]
  );

  const callbacks: AIConfigCallbacks = useMemo(
    () => ({
      addPrompt,
      cancel,
      clearOutputs,
      deleteModelSettings,
      deleteOutput,
      deletePrompt,
      getModels,
      getServerStatus,
      logEventHandler,
      openInTextEditor,
      runPrompt,
      setConfigDescription,
      setConfigName,
      setParameters,
      showNotification,
      updateModel,
      updatePrompt,
      // explicitly omitted
      save: undefined,
    }),
    [
      addPrompt,
      cancel,
      clearOutputs,
      deleteModelSettings,
      deleteOutput,
      deletePrompt,
      getModels,
      getServerStatus,
      logEventHandler,
      openInTextEditor,
      runPrompt,
      setConfigDescription,
      setConfigName,
      setParameters,
      showNotification,
      updateModel,
      updatePrompt,
    ]
  );

  return (
    <div className={classes.editorBackground}>
      {!aiconfig ? (
        <Flex justify="center" mt="xl">
          <Loader size="xl" />
        </Flex>
      ) : (
        <AIConfigEditor
          aiconfig={aiconfig}
          callbacks={callbacks}
          mode={MODE}
          readOnly={isReadOnly}
          themeOverride={VSCODE_THEME}
          themeMode={themeMode}
        />
      )}
    </div>
  );
}
