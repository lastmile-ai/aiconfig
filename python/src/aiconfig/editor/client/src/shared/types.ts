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
  | "SAVE_BUTTON_CLICKED" 
  | "RUN_PROMPT_START"
  | "RUN_PROMPT_CANCELED" 
  | "RUN_PROMPT_ERROR" 
  | "RUN_PROMPT_SUCCESS";

// TODO: schematize this
export type LogEventData = JSONObject;
