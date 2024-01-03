import { ClientAIConfig, ClientPrompt } from "../shared/types";
import { getPromptModelName } from "../utils/promptUtils";
import { AIConfig, JSONObject, PromptInput } from "aiconfig";

export type AIConfigReducerAction =
  | MutateAIConfigAction
  | ConsolidateAIConfigAction
  | RunPromptErrorAction;

export type MutateAIConfigAction =
  | AddPromptAction
  | DeletePromptAction
  | RunPromptAction
  | SetDescriptionAction
  | SetNameAction
  | UpdatePromptInputAction
  | UpdatePromptNameAction
  | UpdatePromptModelAction
  | UpdatePromptModelSettingsAction
  | UpdatePromptParametersAction
  | UpdateGlobalParametersAction;

export type ConsolidateAIConfigAction = {
  type: "CONSOLIDATE_AICONFIG";
  action: MutateAIConfigAction;
  config: AIConfig;
};

export type AddPromptAction = {
  type: "ADD_PROMPT_AT_INDEX";
  index: number;
  prompt: ClientPrompt;
};

export type DeletePromptAction = {
  type: "DELETE_PROMPT";
  id: string;
};

export type RunPromptAction = {
  type: "RUN_PROMPT";
  id: string;
};

export type RunPromptErrorAction = {
  type: "RUN_PROMPT_ERROR";
  id: string;
  message?: string;
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

function reduceReplacePrompt(
  state: ClientAIConfig,
  id: string,
  replacerFn: (prompt: ClientPrompt) => ClientPrompt
): ClientAIConfig {
  return {
    ...state,
    prompts: state.prompts.map((prompt) =>
      prompt._ui.id === id ? replacerFn(prompt) : prompt
    ),
  };
}

function reduceReplaceInput(
  state: ClientAIConfig,
  id: string,
  replacerFn: (input: PromptInput) => PromptInput
): ClientAIConfig {
  return reduceReplacePrompt(state, id, (prompt) => ({
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
  // Make sure prompt structure is properly updated. Client input and metadata takes precedence
  // since it may have been updated by the user while the request was in flight
  const consolidatePrompt = (statePrompt: ClientPrompt) => {
    const responsePrompt = responseConfig.prompts.find(
      (resPrompt) => resPrompt.name === statePrompt.name
    );
    return {
      ...responsePrompt,
      ...statePrompt,
      metadata: {
        ...responsePrompt?.metadata,
        ...statePrompt.metadata,
      },
    } as ClientPrompt;
  };

  switch (action.type) {
    case "ADD_PROMPT_AT_INDEX": {
      return reduceReplacePrompt(
        state,
        action.prompt._ui.id,
        consolidatePrompt
      );
    }
    case "RUN_PROMPT": {
      return reduceReplacePrompt(state, action.id, (prompt) => {
        const responsePrompt = responseConfig.prompts.find(
          (resPrompt) => resPrompt.name === prompt.name
        );

        const outputs = responsePrompt?.outputs ?? prompt.outputs;

        return {
          ...prompt,
          _ui: {
            ...prompt._ui,
            isRunning: false,
          },
          outputs,
        };
      });
    }
    case "UPDATE_PROMPT_INPUT": {
      return reduceReplacePrompt(state, action.id, consolidatePrompt);
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
      return reduceInsertPromptAtIndex(state, action.index, action.prompt);
    }
    case "DELETE_PROMPT": {
      return {
        ...state,
        prompts: state.prompts.filter((prompt) => prompt._ui.id !== action.id),
      };
    }
    case "RUN_PROMPT": {
      return reduceReplacePrompt(state, action.id, (prompt) => ({
        ...prompt,
        _ui: {
          ...prompt._ui,
          isRunning: true,
        },
      }));
    }
    case "RUN_PROMPT_ERROR": {
      return reduceReplacePrompt(state, action.id, (prompt) => ({
        ...prompt,
        _ui: {
          ...prompt._ui,
          isRunning: false,
        },
      }));
    }
    case "SET_DESCRIPTION": {
      return {
        ...state,
        description: action.description,
      };
    }
    case "SET_NAME": {
      return {
        ...state,
        name: action.name,
      };
    }
    case "UPDATE_PROMPT_INPUT": {
      return reduceReplaceInput(state, action.id, () => action.input);
    }
    case "UPDATE_PROMPT_NAME": {
      // Validate that no prompt has a name that conflicts with this one:
      const existingPromptNames = state.prompts.map((prompt) => prompt.name);

      if (
        existingPromptNames.find((existingName) => action.name === existingName)
      ) {
        // Don't allow duplicate names
        return state;
      }
      return reduceReplacePrompt(state, action.id, (prompt) => ({
        ...prompt,
        name: action.name,
      }));
    }
    case "UPDATE_PROMPT_MODEL": {
      return reduceReplacePrompt(state, action.id, (prompt) => ({
        ...prompt,
        metadata: {
          ...prompt.metadata,
          model: action.modelName
            ? {
                name: action.modelName,
                // TODO: Consolidate settings based on schema union
              }
            : undefined,
        },
      }));
    }
    case "UPDATE_PROMPT_MODEL_SETTINGS": {
      return reduceReplacePrompt(state, action.id, (prompt) => ({
        ...prompt,
        metadata: {
          ...prompt.metadata,
          model: {
            // TODO: Figure out why 'as' is needed here. Should just be ClientAIConfig and that
            // should properly type metadata
            // ModelMetadata must have name here
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            name: getPromptModelName(
              prompt,
              (state as unknown as AIConfig).metadata.default_model
            )!,
            settings: action.modelSettings,
          },
        },
      }));
    }
    case "UPDATE_PROMPT_PARAMETERS": {
      return reduceReplacePrompt(state, action.id, (prompt) => ({
        ...prompt,
        metadata: {
          ...prompt.metadata,
          parameters: action.parameters,
        },
      }));
    }
    case "UPDATE_GLOBAL_PARAMETERS": {
      return {
        ...state,
        metadata: {
          ...state.metadata,
          parameters: action.parameters,
        },
      };
    }
    case "CONSOLIDATE_AICONFIG": {
      return reduceConsolidateAIConfig(state, action.action, action.config);
    }
  }
}
