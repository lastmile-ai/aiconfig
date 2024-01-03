import { AIConfig } from "aiconfig";
import { ClientAIConfig, ClientPrompt } from "../shared/types";

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
