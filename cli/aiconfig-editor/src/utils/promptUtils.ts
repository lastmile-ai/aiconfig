import { AIConfig, Prompt } from "aiconfig";

/**
 * Get the name of the model for the specified prompt. The name will either be specified in the prompt's
 * model metadata, or as the default_model in the aiconfig metadata
 * @param prompt The Prompt to get the model name for
 * @param defaultConfigModelName The default model name specified in the AIConfig metadata (if specified)
 * @returns string The name of the model for the specified prompt
 */
export function getPromptModelName(
  prompt: Prompt,
  defaultConfigModelName?: string
): string {
  const promptMetadataModel = prompt.metadata?.model;
  if (promptMetadataModel) {
    if (typeof promptMetadataModel === "string") {
      return promptMetadataModel;
    } else {
      return promptMetadataModel.name;
    }
  }

  // Model must be specified as default if not specified for the Prompt
  return defaultConfigModelName!;
}
