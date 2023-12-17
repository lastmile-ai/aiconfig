import { AIConfig, Prompt, PromptInput } from "aiconfig";

type AIConfigReducerAction = UpdatePromptInputAction;

export type UpdatePromptInputAction = {
  type: "UPDATE_PROMPT_INPUT";
  index: number;
  input: PromptInput;
};

function reduceReplacePrompt(
  state: AIConfig,
  index: number,
  replacerFn: (prompt: Prompt) => Prompt
) {
  return {
    ...state,
    prompts: state.prompts.map((prompt, i) =>
      i === index ? replacerFn(prompt) : prompt
    ),
  };
}

function reduceReplaceInput(
  state: AIConfig,
  index: number,
  replacerFn: (input: PromptInput) => PromptInput
) {
  return reduceReplacePrompt(state, index, (prompt) => ({
    ...prompt,
    input: replacerFn(prompt.input),
  }));
}

export default function aiconfigReducer(
  state: AIConfig,
  action: AIConfigReducerAction
) {
  switch (action.type) {
    case "UPDATE_PROMPT_INPUT": {
      return reduceReplaceInput(state, action.index, () => action.input);
    }
  }
}
