import { AIConfig, Prompt, Error, ExecuteResult } from "aiconfig";

export type EditorFile = {
  name: string;
  extension: string;
  path: string;
  isDirectory: boolean;
  disabled?: boolean;
};

export type TextExecuteResultOutput = {
  type: "text";
  text: string;
};

export type ClientExecuteResultOutput = TextExecuteResultOutput; // TODO: Add non-text types

export type ClientExecuteResult = ExecuteResult & {
  renderData: ClientExecuteResultOutput;
};

export type ClientPromptOutput = ClientExecuteResult | Error;

export type ClientPrompt = Omit<Prompt, "outputs"> & {
  outputs?: ClientPromptOutput[];
};

export type ClientAIConfig = Omit<AIConfig, "prompts"> & {
  prompts: ClientPrompt[];
};

export function clientConfigToAIConfig(config: ClientAIConfig): AIConfig {
  return {
    ...config,
    prompts: config.prompts.map((prompt) => ({
      ...prompt,
      outputs: prompt.outputs?.map((output) => ({
        ...output,
        client: undefined,
      })),
    })),
  } as AIConfig;
}
