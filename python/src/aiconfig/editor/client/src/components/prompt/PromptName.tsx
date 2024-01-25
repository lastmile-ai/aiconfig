import { TextInput, Tooltip } from "@mantine/core";
import { ChangeEvent, memo, useContext, useState } from "react";
import AIConfigContext from "../../contexts/AIConfigContext";

type Props = {
  promptId: string;
  name: string;
  onUpdate: (name: string) => void;
};

export default memo(function PromptName({ promptId, name, onUpdate }: Props) {
  const { getState } = useContext(AIConfigContext);

  // Use local component state to show error for duplicate names
  // AIConfig state will not set duplicates to be safe
  const [nameInput, setNameInput] = useState(name);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNameInput(e.currentTarget.value);
    onUpdate(e.currentTarget.value);
  };

  return (
    <Tooltip label="Prompt Name" position="right">
      <TextInput
        value={nameInput}
        label="Prompt Name"
        className="ghost"
        variant="unstyled"
        placeholder="Name this prompt"
        onChange={onChange}
        error={
          getState().prompts.some(
            (p) => p.name === nameInput && p._ui.id !== promptId
          )
            ? "Name already exists"
            : null
        }
      />
    </Tooltip>
  );
});
