import { AIConfig } from "aiconfig";

export function getDefaultNewPromptName(aiconfig: AIConfig): string {
  const existingNames = aiconfig.prompts.map((prompt) => prompt.name);
  let i = existingNames.length + 1;
  while (existingNames.includes(`prompt_${i}`)) {
    i++;
  }
  return `prompt_${i}`;
}

export function getPromptName(aiconfig: AIConfig, promptIndex: number): string {
  return aiconfig.prompts[promptIndex]!.name;
}
