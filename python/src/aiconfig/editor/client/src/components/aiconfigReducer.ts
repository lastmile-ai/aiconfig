import { ClientAIConfig, ClientPrompt } from "../shared/types";
import { getPromptModelName } from "../utils/promptUtils";
import { AIConfig, JSONObject, Prompt, PromptInput } from "aiconfig";

export type AIConfigReducerAction =
  | MutateAIConfigAction
  | ConsolidateAIConfigAction;

export type MutateAIConfigAction =
  | AddPromptAction
  | UpdatePromptInputAction
  | UpdatePromptModelSettingsAction
  | UpdatePromptParametersAction;

export type ConsolidateAIConfigAction = {
  type: "CONSOLIDATE_AICONFIG";
  action: MutateAIConfigAction;
  config: AIConfig;
};

export type AddPromptAction = {
  type: "ADD_PROMPT_AT_INDEX";
  index: number;
  prompt: Prompt;
};

export type UpdatePromptInputAction = {
  type: "UPDATE_PROMPT_INPUT";
  index: number;
  input: PromptInput;
};

export type UpdatePromptModelSettingsAction = {
  type: "UPDATE_PROMPT_MODEL_SETTINGS";
  index: number;
  modelSettings: JSONObject;
};

// TODO: saqadri - can likely use this same action for global parameters update
export type UpdatePromptParametersAction = {
  type: "UPDATE_PROMPT_PARAMETERS";
  index: number;
  parameters: JSONObject;
};

function reduceReplacePrompt(
  state: ClientAIConfig,
  index: number,
  replacerFn: (prompt: ClientPrompt) => ClientPrompt
): ClientAIConfig {
  return {
    ...state,
    prompts: state.prompts.map((prompt, i) =>
      i === index ? replacerFn(prompt) : prompt
    ),
  };
}

function reduceReplaceInput(
  state: ClientAIConfig,
  index: number,
  replacerFn: (input: PromptInput) => PromptInput
): ClientAIConfig {
  return reduceReplacePrompt(state, index, (prompt) => ({
    ...prompt,
    input: replacerFn(prompt.input),
  }));
}

function reduceInsertPromptAtIndex(
  state: ClientAIConfig,
  index: number,
  prompt: ClientPrompt
): ClientAIConfig {
  return {
    ...state,
    prompts: [
      ...state.prompts.slice(0, index),
      prompt,
      ...state.prompts.slice(index),
    ],
  };
}

function reduceConsolidateAIConfig(
  state: ClientAIConfig,
  action: MutateAIConfigAction,
  responseConfig: AIConfig
): ClientAIConfig {
  switch (action.type) {
    case "ADD_PROMPT_AT_INDEX": {
      // Make sure prompt structure is properly updated. Client input and metadata takes precedence
      // since it may have been updated by the user while the request was in flight
      return reduceReplacePrompt(state, action.index, (prompt) => {
        const responsePrompt = responseConfig.prompts[action.index];
        return {
          ...responsePrompt,
          ...prompt,
          metadata: {
            ...responsePrompt.metadata,
            ...prompt.metadata,
          },
        } as ClientPrompt;
      });
    }
    default: {
      return state;
    }
  }
}

export default function aiconfigReducer(
  state: ClientAIConfig,
  action: AIConfigReducerAction
): ClientAIConfig {
  switch (action.type) {
    case "ADD_PROMPT_AT_INDEX": {
      return reduceInsertPromptAtIndex(
        state,
        action.index,
        action.prompt as ClientPrompt
      );
    }
    case "UPDATE_PROMPT_INPUT": {
      return reduceReplaceInput(state, action.index, () => action.input);
    }
    case "UPDATE_PROMPT_MODEL_SETTINGS": {
      return reduceReplacePrompt(state, action.index, (prompt) => ({
        ...prompt,
        metadata: {
          ...prompt.metadata,
          model: {
            // TODO: Figure out why 'as' is needed here. Should just be ClientAIConfig and that
            // should properly type metadata
            name: getPromptModelName(
              prompt,
              (state as AIConfig).metadata.default_model
            ),
            settings: action.modelSettings,
          },
        },
      }));
    }
    case "UPDATE_PROMPT_PARAMETERS": {
      return reduceReplacePrompt(state, action.index, (prompt) => ({
        ...prompt,
        metadata: {
          ...prompt.metadata,
          parameters: action.parameters,
        },
      }));
    }
    case "CONSOLIDATE_AICONFIG": {
      return reduceConsolidateAIConfig(state, action.action, action.config);
    }
  }
}
