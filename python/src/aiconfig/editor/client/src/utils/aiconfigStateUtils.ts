import { AIConfig } from "aiconfig";
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

export function getPromptByName(
  aiConfig: ClientAIConfig,
  promptName: string
): ClientPrompt | undefined {
  return aiConfig.prompts.find((prompt) => prompt.name === promptName);
}

export function getPromptIdByName(
  aiConfig: ClientAIConfig,
  promptName: string
): string | undefined {
  const prompt = getPromptByName(aiConfig, promptName);
  return prompt?._ui.id;
}

export function getPromptNameById(
  aiConfig: ClientAIConfig,
  promptId: string
): string | undefined {
  const prompt = getPrompt(aiConfig, promptId);
  return prompt?.name;
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
