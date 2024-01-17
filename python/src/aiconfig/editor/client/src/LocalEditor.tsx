import AIConfigEditor, {
  AIConfigCallbacks,
  RunPromptStreamCallback,
  RunPromptStreamErrorCallback,
  RunPromptStreamErrorEvent,
} from "./components/AIConfigEditor";
import { Flex, Loader, Image, createStyles } from "@mantine/core";
import {
  AIConfig,
  InferenceSettings,
  JSONObject,
  Output,
  Prompt,
} from "aiconfig";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ufetch } from "ufetch";
import { ROUTE_TABLE } from "./utils/api";
import { streamingApiChain } from "./utils/oboeHelpers";
import { datadogLogs } from "@datadog/browser-logs";
import { LogEvent, LogEventData } from "./shared/types";

const useStyles = createStyles(() => ({
  editorBackground: {
    background:
      "radial-gradient(ellipse at top,#08122d,#030712),radial-gradient(ellipse at bottom,#030712,#030712)",
    margin: "0 auto",
    minHeight: "100vh",
  },

  logo: {
    maxWidth: "80rem",
    margin: "0 auto",
    padding: "32px 0 0 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
}));

export default function LocalEditor() {
  const [aiconfig, setAiConfig] = useState<AIConfig | undefined>();
  const { classes } = useStyles();

  const loadConfig = useCallback(async () => {
    const res = await ufetch.post(ROUTE_TABLE.LOAD, {});
    setAiConfig(res.aiconfig);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const setupTelemetryIfAllowed = useCallback(async () => {
    const isDev = (process.env.NODE_ENV ?? "development") === "development";

    // Don't enable telemetry in dev mode because hot reload will spam the logs.
    if (isDev) {
      return;
    }

    const res = await ufetch.get(ROUTE_TABLE.GET_AICONFIGRC, {});

    const enableTelemetry = res.allow_usage_data_sharing;

    if (enableTelemetry) {
      datadogLogs.init({
        clientToken: "pub356987caf022337989e492681d1944a8",
        env: process.env.NODE_ENV ?? "development",
        service: "aiconfig-editor",
        site: "us5.datadoghq.com",
        forwardErrorsToLogs: true,
        sessionSampleRate: 100,
      });
    }
  }, []);

  useEffect(() => {
    setupTelemetryIfAllowed();
  }, [setupTelemetryIfAllowed]);

  const save = useCallback(async (aiconfig: AIConfig) => {
    const res = await ufetch.post(ROUTE_TABLE.SAVE, {
      // path: file path,
      aiconfig,
    });
    return res;
  }, []);

  const getModels = useCallback(async (search: string) => {
    // For now, rely on caching and handle client-side search filtering
    // We will use server-side search filtering for Gradio
    const res = await ufetch.get(ROUTE_TABLE.LIST_MODELS);
    const models = res.data;
    if (search && search.length > 0) {
      const lowerCaseSearch = search.toLowerCase();
      return models.filter(
        (model: string) =>
          model.toLocaleLowerCase().indexOf(lowerCaseSearch) >= 0
      );
    }
    return models;
  }, []);

  const addPrompt = useCallback(
    async (promptName: string, promptData: Prompt, index: number) => {
      return await ufetch.post(ROUTE_TABLE.ADD_PROMPT, {
        prompt_name: promptName,
        prompt_data: promptData,
        index,
      });
    },
    []
  );

  const deletePrompt = useCallback(async (promptName: string) => {
    return await ufetch.post(ROUTE_TABLE.DELETE_PROMPT, {
      prompt_name: promptName,
    });
  }, []);

  const clearOutputs = useCallback(async () => {
    return await ufetch.post(ROUTE_TABLE.CLEAR_OUTPUTS, {});
  }, []);

  const runPrompt = useCallback(
    async (
      promptName: string,
      onStream: RunPromptStreamCallback,
      onError: RunPromptStreamErrorCallback,
      enableStreaming: boolean = true,
      cancellationToken?: string
    ) => {
      // Note: We run the streaming API even for
      // non-streaming runs so that we can unify
      // the way we process data on the client
      return await streamingApiChain<{ aiconfig: AIConfig }>(
        {
          url: ROUTE_TABLE.RUN_PROMPT,
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
          },
          aiconfig_chunk: (data) => {
            onStream({ type: "aiconfig_chunk", data: data as AIConfig });
          },
          stop_streaming: (_data) => {
            onStream({ type: "stop_streaming", data: null });
          },
          error: (data) => {
            onError({
              type: "error",
              data: data as RunPromptStreamErrorEvent["data"],
            });
          },
        }
      );
    },
    []
  );

  const cancel = useCallback(async (cancellationToken: string) => {
    // TODO: saqadri - check the status of the response (can be 400 or 422 if cancellation fails)
    return await ufetch.post(ROUTE_TABLE.CANCEL, {
      cancellation_token_id: cancellationToken,
    });
  }, []);

  const updatePrompt = useCallback(
    async (promptName: string, promptData: Prompt) => {
      return await ufetch.post(ROUTE_TABLE.UPDATE_PROMPT, {
        prompt_name: promptName,
        prompt_data: promptData,
      });
    },
    []
  );

  const updateModel = useCallback(
    async (value: {
      modelName?: string;
      settings?: InferenceSettings;
      promptName?: string;
    }) => {
      return await ufetch.post(ROUTE_TABLE.UPDATE_MODEL, {
        model_name: value.modelName,
        settings: value.settings,
        prompt_name: value.promptName,
      });
    },
    []
  );

  const setConfigName = useCallback(async (name: string) => {
    return await ufetch.post(ROUTE_TABLE.SET_NAME, {
      name,
    });
  }, []);

  const setConfigDescription = useCallback(async (description: string) => {
    return await ufetch.post(ROUTE_TABLE.SET_DESCRIPTION, {
      description,
    });
  }, []);

  const setParameters = useCallback(
    async (parameters: JSONObject, promptName?: string) => {
      return await ufetch.post(ROUTE_TABLE.SET_PARAMETERS, {
        parameters,
        prompt_name: promptName,
      });
    },
    []
  );

  const getServerStatus = useCallback(async () => {
    return await ufetch.get(ROUTE_TABLE.SERVER_STATUS);
  }, []);

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

  const callbacks: AIConfigCallbacks = useMemo(
    () => ({
      addPrompt,
      cancel,
      clearOutputs,
      deletePrompt,
      getModels,
      getServerStatus,
      logEventHandler,
      runPrompt,
      save,
      setConfigDescription,
      setConfigName,
      setParameters,
      updateModel,
      updatePrompt,
    }),
    [
      addPrompt,
      cancel,
      clearOutputs,
      deletePrompt,
      getModels,
      getServerStatus,
      logEventHandler,
      runPrompt,
      save,
      setConfigDescription,
      setConfigName,
      setParameters,
      updateModel,
      updatePrompt,
    ]
  );

  return (
    <div className={classes.editorBackground}>
      <div className={classes.logo}>
        <Image
          withPlaceholder
          maw={140}
          src="images/aiconfigLogo.png"
          alt="AiConfig Logo"
        />
      </div>
      {!aiconfig ? (
        <Flex justify="center" mt="xl">
          <Loader size="xl" />
        </Flex>
      ) : (
        <AIConfigEditor
          aiconfig={aiconfig}
          callbacks={callbacks}
          mode="local"
        />
      )}
    </div>
  );
}
