import { Textarea } from "@mantine/core";
import { PromptInput } from "aiconfig";
import { memo } from "react";

type Props = {
  input: PromptInput;
  onChangeInput: (value: PromptInput) => void;
};

export default memo(function PromptInputConfigRenderer({
  input,
  onChangeInput,
}: Props) {
  return (
    <Textarea
      value={input as string}
      onChange={(e) => onChangeInput(e.target.value)}
    />
  );
});
