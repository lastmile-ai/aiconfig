import { AIConfig, JSONObject, Prompt } from "aiconfig";
import { uniqueId } from "lodash";

export type EditorFile = {
  name: string;
  extension: string;
  path: string;
  isDirectory: boolean;
  disabled?: boolean;
};

export type ClientPrompt = Prompt & {
  _ui: {
    id: string;
    isRunning?: boolean;
    cancellationToken?: string;
  };
};

export type ClientAIConfig = Omit<AIConfig, "prompts"> & {
  prompts: ClientPrompt[];
  _ui: {
    isDirty?: boolean;
    runningPromptId?: string;
  };
};

export function clientPromptToAIConfigPrompt(prompt: ClientPrompt): Prompt {
  const configPrompt = {
    ...prompt,
    _ui: undefined,
  };
  delete configPrompt._ui;
  return configPrompt;
}

export function clientConfigToAIConfig(clientConfig: ClientAIConfig): AIConfig {
  const config = {
    ...clientConfig,
    prompts: clientConfig.prompts.map(clientPromptToAIConfigPrompt),
    _ui: undefined,
  };

  delete config._ui;

  // For some reason, TS thinks ClientAIConfig is missing properties from
  // AIConfig, so we have to cast it
  return config as unknown as AIConfig;
}

export function aiConfigToClientConfig(aiconfig: AIConfig): ClientAIConfig {
  return {
    ...aiconfig,
    prompts: aiconfig.prompts.map((prompt) => ({
      ...prompt,
      _ui: {
        id: uniqueId(),
      },
    })),
    _ui: {
      isDirty: false,
    },
  };
}

export type LogEvent =
  | "ADD_PROMPT"
  | "CLEAR_OUTPUTS"
  | "DELETE_OUTPUT"
  | "DELETE_GLOBAL_MODEL_SETTINGS"
  | "DELETE_PROMPT"
  | "DOWNLOAD_BUTTON_CLICKED"
  | "RUN_PROMPT_CANCELED"
  | "RUN_PROMPT_ERROR"
  | "RUN_PROMPT_START"
  | "RUN_PROMPT_SUCCESS"
  | "SAVE_BUTTON_CLICKED"
  | "SET_DESCRIPTION"
  | "SET_NAME"
  | "SHARE_BUTTON_CLICKED"
  | "UPDATE_GLOBAL_MODEL_SETTINGS"
  | "UPDATE_GLOBAL_PARAMETERS"
  | "UPDATE_PROMPT_INPUT"
  | "UPDATE_PROMPT_MODEL"
  | "UPDATE_PROMPT_MODEL_SETTINGS"
  | "UPDATE_PROMPT_NAME"
  | "UPDATE_PROMPT_PARAMETERS";

// TODO: schematize this
export type LogEventData = JSONObject;

export type AIConfigEditorMode = "local" | "gradio" | "vscode";

export type ThemeMode = "light" | "dark";
