import { ClientAIConfig, ClientPrompt } from "@/src/shared/types";
import { PromptInput } from "aiconfig";

type AIConfigReducerAction = UpdatePromptInputAction;

export type UpdatePromptInputAction = {
  type: "UPDATE_PROMPT_INPUT";
  index: number;
  input: PromptInput;
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

export default function aiconfigReducer(
  state: ClientAIConfig,
  action: AIConfigReducerAction
): ClientAIConfig {
  switch (action.type) {
    case "UPDATE_PROMPT_INPUT": {
      return reduceReplaceInput(state, action.index, () => action.input);
    }
  }
}
