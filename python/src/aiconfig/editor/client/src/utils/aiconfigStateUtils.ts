import { AIConfig, Prompt } from "aiconfig";
import { ClientAIConfig, ClientPrompt } from "../shared/types";
import { getPromptModelName } from "./promptUtils";

export function getDefaultNewPromptName(aiconfig: AIConfig): string {
  const existingNames = aiconfig.prompts.map((prompt) => prompt.name);
  let i = existingNames.length + 1;
  while (existingNames.includes(`prompt_${i}`)) {
    i++;
  }
  return `prompt_${i}`;
}

export function getPrompt(
  aiconfig: ClientAIConfig,
  id: string
): ClientPrompt | undefined {
  return aiconfig.prompts.find((prompt) => prompt._ui.id === id);
}

export function getModelSettingsStream(
  prompt: ClientPrompt,
  config: ClientAIConfig
): boolean | undefined {
  const promptModelSettings =
    prompt.metadata?.model && typeof prompt.metadata.model !== "string"
      ? prompt.metadata.model?.settings
      : undefined;
  if (promptModelSettings) {
    if (promptModelSettings?.stream === true) {
      return true;
    } else if (promptModelSettings?.stream === false) {
      return false;
    }
  }

  const promptModelName = getPromptModelName(prompt);
  if (promptModelName) {
    const globalModelSettings =
      config.metadata?.models?.[promptModelName]?.settings;
    if (globalModelSettings?.stream === true) {
      return true;
    } else if (promptModelSettings?.stream === false) {
      return false;
    }
  }

  return undefined;
}

export function convertClientAIConfigToAIConfig(
  clientConfig: ClientAIConfig
): AIConfig {
  const {
    _ui: _config_ui,
    prompts: client_prompts,
    ...config_without_ui_and_prompts
  } = clientConfig;
  const prompts: Prompt[] = client_prompts.map((prompt) => {
    const { _ui: _prompt_ui, ...regular_prompt } = prompt;
    return regular_prompt;
  });
  return {
    ...(config_without_ui_and_prompts as Omit<AIConfig, "prompts">),
    prompts,
  } as AIConfig;
}
