import { TextInput } from "@mantine/core";
import { memo } from "react";

type Props = {
  name: string;
  onUpdate: (name: string) => void;
};

export default memo(function PromptName({ name, onUpdate }: Props) {
  return (
    <TextInput
      value={name}
      placeholder="Name this prompt"
      onChange={(e) => onUpdate(e.currentTarget.value)}
    />
  );
});
