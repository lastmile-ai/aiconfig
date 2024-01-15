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
  | RunPromptCancelAction
  | RunPromptErrorAction
  | RunPromptSuccessAction
  | StreamAIConfigChunkAction
  | StreamOutputChunkAction
  | StopStreamingAction;

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
  id: string;
  cancellationToken?: string;
  isRunning?: boolean;
};

export type RunPromptCancelAction = {
  type: "RUN_PROMPT_CANCEL";
  id: string;
  config: AIConfig;
  cancellationToken?: string;
};

export type RunPromptErrorAction = {
  type: "RUN_PROMPT_ERROR";
  id: string;
  message?: string;
};

export type RunPromptSuccessAction = {
  type: "RUN_PROMPT_SUCCESS";
  id: string;
  config: AIConfig;
};

export type StreamAIConfigChunkAction = {
  type: "STREAM_AICONFIG_CHUNK";
  config: AIConfig;
  cancellationToken?: string;
};

export type StreamOutputChunkAction = {
  type: "STREAM_OUTPUT_CHUNK";
  id: string;
  output: Output;
};

export type StopStreamingAction = {
  type: "STOP_STREAMING";
  id: string;
};

// Save Action --> In future, probably group this with other non-mutate
// actions like setting logging preferences, share button action etc
export type SaveConfigSuccessAction = {
  type: "SAVE_CONFIG_SUCCESS";
};
