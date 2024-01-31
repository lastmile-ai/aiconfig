import { AIConfig, JSONObject, Output, PromptInput } from "aiconfig";
import { ClientPrompt } from "../shared/types";

export type AIConfigReducerAction =
  | MutateAIConfigAction
  | RunPromptAction
  | ConsolidateAIConfigAction
  | SaveConfigSuccessAction;

// Actions the user can do to manually update the AIConfig
export type MutateAIConfigAction =
  | AddPromptAction
  | ClearOutputsAction
  | DeletePromptAction
  | ProvidedAIConfigUpdateAction
  | SetDescriptionAction
  | SetNameAction
  | UpdatePromptInputAction
  | UpdatePromptNameAction
  | UpdatePromptModelAction
  | UpdatePromptModelSettingsAction
  | UpdatePromptParametersAction
  | UpdateGlobalParametersAction;

// Action that can occur when user runs a prompt
export type RunPromptAction =
  | RunPromptStartAction
  | StreamAIConfigChunkAction
  | StreamOutputChunkAction
  | RunPromptCancelAction
  | RunPromptErrorAction
  | RunPromptSuccessAction;

// Actions that appear when called via ConsolidateAIConfigAction
export type ConsolidateAIConfigSubAction =
  | AddPromptAction
  | UpdatePromptInputAction;

export type ConsolidateAIConfigAction = {
  type: "CONSOLIDATE_AICONFIG";
  action: ConsolidateAIConfigSubAction;
  config: AIConfig;
};

// Mutate AIConfig Actions
export type AddPromptAction = {
  type: "ADD_PROMPT_AT_INDEX";
  index: number;
  prompt: ClientPrompt;
};

export type ClearOutputsAction = {
  type: "CLEAR_OUTPUTS";
};

export type DeletePromptAction = {
  type: "DELETE_PROMPT";
  id: string;
};

export type ProvidedAIConfigUpdateAction = {
  type: "PROVIDED_AICONFIG_UPDATE";
  config: AIConfig;
};

export type SetDescriptionAction = {
  type: "SET_DESCRIPTION";
  description: string;
};

export type SetNameAction = {
  type: "SET_NAME";
  name: string;
};

export type UpdatePromptInputAction = {
  type: "UPDATE_PROMPT_INPUT";
  id: string;
  input: PromptInput;
};

export type UpdatePromptNameAction = {
  type: "UPDATE_PROMPT_NAME";
  id: string;
  name: string;
};

export type UpdatePromptModelAction = {
  type: "UPDATE_PROMPT_MODEL";
  id: string;
  modelName?: string;
};

export type UpdatePromptModelSettingsAction = {
  type: "UPDATE_PROMPT_MODEL_SETTINGS";
  id: string;
  modelSettings: JSONObject;
};

export type UpdatePromptParametersAction = {
  type: "UPDATE_PROMPT_PARAMETERS";
  id: string;
  parameters: JSONObject;
};

export type UpdateGlobalParametersAction = {
  type: "UPDATE_GLOBAL_PARAMETERS";
  parameters: JSONObject;
};

// Run Prompt Actions
export type RunPromptStartAction = {
  type: "RUN_PROMPT_START";
  promptId: string;
  isRunning?: boolean;
  cancellationToken?: string;
};

export type RunPromptCancelAction = {
  type: "RUN_PROMPT_CANCEL";
  promptId: string;
  config: AIConfig;
};

export type RunPromptErrorAction = {
  type: "RUN_PROMPT_ERROR";
  promptId: string;
  message?: string;
};

export type RunPromptSuccessAction = {
  type: "RUN_PROMPT_SUCCESS";
  promptId: string;
  config?: AIConfig;
};

export type StreamAIConfigChunkAction = {
  type: "STREAM_AICONFIG_CHUNK";
  config: AIConfig;
};

export type StreamOutputChunkAction = {
  type: "STREAM_OUTPUT_CHUNK";
  promptId: string;
  output: Output;
};

// Save Action --> In future, probably group this with other non-mutate
// actions like setting logging preferences, share button action etc
export type SaveConfigSuccessAction = {
  type: "SAVE_CONFIG_SUCCESS";
};
