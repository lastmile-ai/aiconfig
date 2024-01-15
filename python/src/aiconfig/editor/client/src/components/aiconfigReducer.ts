import { ClientAIConfig, ClientPrompt } from "../shared/types";
import { getPromptModelName } from "../utils/promptUtils";
import { AIConfig, JSONObject, Output, PromptInput } from "aiconfig";

export type AIConfigReducerAction =
  | MutateAIConfigAction
  | ConsolidateAIConfigAction
  | RunPromptErrorAction
  | SaveConfigSuccessAction;

export type MutateAIConfigAction =
  | AddPromptAction
  | ClearOutputsAction
  | DeletePromptAction
  | RunPromptAction
  | SetDescriptionAction
  | SetNameAction
  | StreamAIConfigChunkAction
  | StreamOutputChunkAction
  | StopStreamingAction
  | UpdatePromptInputAction
  | UpdatePromptNameAction
  | UpdatePromptModelAction
  | UpdatePromptModelSettingsAction
  | UpdatePromptParametersAction
  | UpdateGlobalParametersAction;

// Actions that appear when called via ConsolidateAIConfigAction
export type ConsolidateAIConfigSubAction =
  | AddPromptAction
  | RunPromptAction
  | StreamAIConfigChunkAction
  | UpdatePromptInputAction;

export type ConsolidateAIConfigAction = {
  type: "CONSOLIDATE_AICONFIG";
  action: ConsolidateAIConfigSubAction;
  config: AIConfig;
};

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

export type RunPromptAction = {
  type: "RUN_PROMPT";
  id: string;
  cancellationToken?: string;
  isRunning?: boolean;
};

export type RunPromptErrorAction = {
  type: "RUN_PROMPT_ERROR";
  id: string;
  message?: string;
};

export type SaveConfigSuccessAction = {
  type: "SAVE_CONFIG_SUCCESS";
};

export type SetDescriptionAction = {
  type: "SET_DESCRIPTION";
  description: string;
};

export type SetNameAction = {
  type: "SET_NAME";
  name: string;
};

export type StreamAIConfigChunkAction = {
  type: "STREAM_AICONFIG_CHUNK";
  id: string;
  cancellationToken?: string;
  isRunning?: boolean;
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
  action: ConsolidateAIConfigSubAction,
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
      // Note: If we are calling "RUN_PROMPT" directly as a dispatched event
      // type, we automatically set the state there to `isRunning` for that
      // prompt. That logic does not happen here, it happens in
      // `aiconfigReducer`.
      // If we are calling "RUN_PROMPT" indirectly via the action of a
      // "CONSOLIDATE_AICONFIG" dispatch, we end up here. We need to check
      // if we actually want to set the prompt state to `isRunning`
      const isRunning = action.isRunning ?? false;
      const stateWithUpdatedRunningPromptId = {
        ...state,
        _ui: {
          ...state._ui,
          runningPromptId: isRunning ? action.id : undefined,
        },
      };
      return reduceReplacePrompt(
        stateWithUpdatedRunningPromptId,
        action.id,
        (prompt) => {
          const responsePrompt = responseConfig.prompts.find(
            (resPrompt) => resPrompt.name === prompt.name
          );

          const outputs = responsePrompt?.outputs ?? prompt.outputs;

          return {
            ...prompt,
            _ui: {
              ...prompt._ui,
              isRunning,
            },
            outputs,
          };
        }
      );
    }
    case "STREAM_AICONFIG_CHUNK": {
      // Note: If we are calling "RUN_PROMPT" directly as a dispatched event
      // type, we automatically set the state there to `isRunning` for that
      // prompt. That logic does not happen here, it happens in
      // `aiconfigReducer`.
      // If we are calling "RUN_PROMPT" indirectly via the action of a
      // "CONSOLIDATE_AICONFIG" dispatch, we end up here. We need to check
      // if we actually want to set the prompt state to `isRunning`
      const isRunning = action.isRunning ?? false;
      const stateWithUpdatedRunningPromptId = {
        ...state,
        _ui: {
          ...state._ui,
          runningPromptId: isRunning ? action.id : undefined,
        },
      };
      return reduceReplacePrompt(
        stateWithUpdatedRunningPromptId,
        action.id,
        (prompt) => {
          const responsePrompt = responseConfig.prompts.find(
            (resPrompt) => resPrompt.name === prompt.name
          );

          const outputs = responsePrompt?.outputs ?? prompt.outputs;

          return {
            ...prompt,
            _ui: {
              ...prompt._ui,
              isRunning,
            },
            outputs,
          };
        }
      );
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
  const dirtyState = {
    ...state,
    _ui: {
      ...state._ui,
      isDirty: true,
    },
  };
  switch (action.type) {
    case "ADD_PROMPT_AT_INDEX": {
      return reduceInsertPromptAtIndex(dirtyState, action.index, action.prompt);
    }
    case "CLEAR_OUTPUTS": {
      const prompts = state.prompts.map((prompt) => {
        if (prompt.outputs) {
          return {
            ...prompt,
            outputs: undefined,
          };
        } else {
          return prompt;
        }
      });

      for (const prompt of prompts) {
        if (prompt.outputs) {
          delete prompt.outputs;
        }
      }

      return {
        ...dirtyState,
        prompts,
      };
    }
    case "DELETE_PROMPT": {
      return {
        ...dirtyState,
        prompts: dirtyState.prompts.filter(
          (prompt) => prompt._ui.id !== action.id
        ),
      };
    }
    case "RUN_PROMPT": {
      const runningState = {
        ...dirtyState,
        _ui: {
          ...dirtyState._ui,
          runningPromptId: action.id,
        },
      };
      return reduceReplacePrompt(runningState, action.id, (prompt) => ({
        ...prompt,
        _ui: {
          ...prompt._ui,
          cancellationToken: action.cancellationToken,
          isRunning: true,
        },
      }));
    }
    case "RUN_PROMPT_ERROR": {
      const nonRunningState = {
        ...dirtyState,
        _ui: {
          ...dirtyState._ui,
          runningPromptId: undefined,
        },
      };
      return reduceReplacePrompt(nonRunningState, action.id, (prompt) => ({
        ...prompt,
        _ui: {
          ...prompt._ui,
          isRunning: false,
        },
        outputs: [
          {
            output_type: "error",
            ename: "Error",
            evalue: action.message ?? "Error running prompt",
            traceback: [],
          },
        ],
      }));
    }
    case "SAVE_CONFIG_SUCCESS": {
      return {
        ...state,
        _ui: {
          ...state._ui,
          isDirty: false,
        },
      };
    }
    case "SET_DESCRIPTION": {
      return {
        ...dirtyState,
        description: action.description,
      };
    }
    case "SET_NAME": {
      return {
        ...dirtyState,
        name: action.name,
      };
    }
    case "STREAM_AICONFIG_CHUNK": {
      const runningState = {
        ...dirtyState,
        _ui: {
          ...dirtyState._ui,
          runningPromptId: action.id,
        },
      };
      return reduceReplacePrompt(runningState, action.id, (prompt) => ({
        ...prompt,
        _ui: {
          ...prompt._ui,
          cancellationToken: action.cancellationToken,
          isRunning: true,
        },
      }));
    }
    case "STREAM_OUTPUT_CHUNK": {
      return reduceReplacePrompt(dirtyState, action.id, (prompt) => ({
        ...prompt,
        outputs: [action.output],
      }));
    }
    case "STOP_STREAMING": {
      const finishedStreamingState = {
        ...dirtyState,
        _ui: {
          ...dirtyState._ui,
          runningPromptId: undefined,
        },
      };
      return reduceReplacePrompt(
        finishedStreamingState,
        action.id,
        (prompt) => ({
          ...prompt,
          _ui: {
            ...prompt._ui,
            cancellationToken: undefined,
            isRunning: false,
          },
        })
      );
    }
    case "UPDATE_PROMPT_INPUT": {
      return reduceReplaceInput(dirtyState, action.id, () => action.input);
    }
    case "UPDATE_PROMPT_NAME": {
      // Validate that no prompt has a name that conflicts with this one:
      const existingPromptNames = dirtyState.prompts.map(
        (prompt) => prompt.name
      );

      if (
        existingPromptNames.find((existingName) => action.name === existingName)
      ) {
        // Don't allow duplicate names
        return state;
      }
      return reduceReplacePrompt(dirtyState, action.id, (prompt) => ({
        ...prompt,
        name: action.name,
      }));
    }
    case "UPDATE_PROMPT_MODEL": {
      return reduceReplacePrompt(dirtyState, action.id, (prompt) => ({
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
      return reduceReplacePrompt(dirtyState, action.id, (prompt) => ({
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
      return reduceReplacePrompt(dirtyState, action.id, (prompt) => ({
        ...prompt,
        metadata: {
          ...prompt.metadata,
          parameters: action.parameters,
        },
      }));
    }
    case "UPDATE_GLOBAL_PARAMETERS": {
      return {
        ...dirtyState,
        metadata: {
          ...state.metadata,
          parameters: action.parameters,
        },
      };
    }
    case "CONSOLIDATE_AICONFIG": {
      return reduceConsolidateAIConfig(
        dirtyState,
        action.action,
        action.config
      );
    }
  }
}
