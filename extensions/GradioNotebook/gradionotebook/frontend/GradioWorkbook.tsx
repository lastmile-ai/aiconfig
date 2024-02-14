import {
  AIConfigEditor,
  type AIConfigCallbacks,
  type LogEvent,
  type LogEventData,
} from "@lastmileai/aiconfig-editor";
import type { AIConfig } from "aiconfig";
import APITokenInput from "./APITokenInput";
import { Flex, MantineProvider, type MantineTheme } from "@mantine/core";
import WorkbookInfoAlert from "./WorkbookInfoAlert";
import { useMemo } from "react";
import { useCallback, useEffect } from "react";
import { datadogLogs } from "@datadog/browser-logs";
import * as uuid from "uuid";

type Props = {
  aiconfig: AIConfig;
  editorCallbacks: AIConfigCallbacks;
  onSetApiToken: (apiToken: string) => Promise<void>;
  themeMode: "light" | "dark" | "system";
};

const MODE = "gradio";

export default function GradioWorkbook(props: Props) {
  // AIConfigEditor handles dynamic system theme switching by default, so only
  // pass dark or light override
  const themeMode = props.themeMode === "system" ? undefined : props.themeMode;

  const theme = useMemo(
    () => ({
      colorScheme: themeMode,
      defaultGradient: {
        from: "#E88949",
        to: "#E85921",
        deg: 90,
      },
      globalStyles: (theme: MantineTheme) => {
        const inputBorderColor =
          theme.colorScheme === "light" ? "#E5E7EB" : "#384152";
        const inputBackgroundColor =
          theme.colorScheme === "light" ? "white" : "#374151";

        return {
          "div.editorBackground": {
            background: theme.colorScheme === "light" ? "white" : "#0b0f19",

            ".mantine-Input-input": {
              border: `1px solid ${inputBorderColor} !important`,
              boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
              backgroundColor: inputBackgroundColor,
              ":focus": {
                outline: "solid 1px #E85921 !important",
                outlineOffset: "-1px",
              },
            },
          },
        };
      },
    }),
    [themeMode]
  );

  const setupTelemetry = useCallback(async () => {
    // skip aiconfigrc check in gradio; enable telemetry by default.
    // yarn dev will set this environment variable.
    const isDev = (process.env.NODE_ENV ?? "production") === "development";
    if (isDev) {
      return;
    }

    // session_id is not reset whenever we refresh the page,
    // so we are explicitly setting one here on initialization
    // See test plan in https://github.com/lastmile-ai/gradio-workbook/pull/184
    // for more details
    const sessionId: string = uuid.v4();
    datadogLogs.init({
      clientToken: "pub356987caf022337989e492681d1944a8",
      env: process.env.NODE_ENV ?? "development",
      service: "gradio-notebook",
      site: "us5.datadoghq.com",
      forwardErrorsToLogs: true,
      sessionSampleRate: 100,
    });

    datadogLogs.setGlobalContextProperty("mode", MODE);
    datadogLogs.setGlobalContextProperty("session_id_internal", sessionId);
  }, []);

  useEffect(() => {
    setupTelemetry();
  }, [setupTelemetry]);

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

  const callbacks = {
    ...props.editorCallbacks,
    logEventHandler: logEventHandler,
  };

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS theme={theme}>
      <div className="editorBackground">
        <Flex direction="column" p="0 1rem" mt="1rem">
          <WorkbookInfoAlert />
          <APITokenInput onSetToken={props.onSetApiToken} />
        </Flex>
        <AIConfigEditor
          callbacks={callbacks}
          aiconfig={props.aiconfig}
          mode={MODE}
          themeMode={themeMode}
        />
      </div>
    </MantineProvider>
  );
}
