import { Spoiler, Textarea } from "@mantine/core";
import { PromptInput } from "aiconfig";
import { memo, useContext } from "react";
import AIConfigContext from "../../../contexts/AIConfigContext";
import { TextRenderer } from "../TextRenderer";

type Props = {
  input: PromptInput;
  onChangeInput: (value: PromptInput) => void;
  runPrompt: () => Promise<void>;
};

export default memo(function PromptInputConfigRenderer({
  input,
  onChangeInput,
  runPrompt,
}: Props) {
  const { readOnly } = useContext(AIConfigContext);
  return readOnly ? (
    <div style={{ padding: "0.5em" }}>
      <Spoiler
        maxHeight={200}
        showLabel="Show more"
        hideLabel="Hide"
        initialState={false}
        transitionDuration={300}
      >
        <TextRenderer content={input as string} />
      </Spoiler>
    </div>
  ) : (
    <Textarea
      label="Prompt"
      value={input as string}
      onChange={(e) => onChangeInput(e.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && (event.shiftKey || event.ctrlKey)) {
          event.preventDefault();
          runPrompt();
        }
      }}
      disabled={readOnly}
    />
  );
});
