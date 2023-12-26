import { AIConfig } from "aiconfig";

export function getDefaultNewPromptName(aiconfig: AIConfig): string {
  const existingNames = aiconfig.prompts.map((prompt) => prompt.name);
  let i = existingNames.length + 1;
  while (existingNames.includes(`Prompt ${i}`)) {
    i++;
  }
  return `Prompt ${i}`;
}
