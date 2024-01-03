import { AIConfig, Prompt } from "aiconfig";
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
  };
};

export type ClientAIConfig = Omit<AIConfig, "prompts"> & {
  prompts: ClientPrompt[];
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
  // For some reason, TS thinks ClientAIConfig is missing properties from
  // AIConfig, so we have to cast it
  return {
    ...clientConfig,
    prompts: clientConfig.prompts.map(clientPromptToAIConfigPrompt),
  } as unknown as AIConfig;
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
  };
}
