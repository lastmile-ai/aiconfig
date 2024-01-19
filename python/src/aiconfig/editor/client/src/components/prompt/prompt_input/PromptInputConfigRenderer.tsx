import { Textarea } from "@mantine/core";
import { PromptInput } from "aiconfig";
import { memo, useContext } from "react";
import AIConfigContext from "../../../contexts/AIConfigContext";

type Props = {
  input: PromptInput;
  onChangeInput: (value: PromptInput) => void;
};

export default memo(function PromptInputConfigRenderer({
  input,
  onChangeInput,
}: Props) {
  const {readOnly} = useContext(AIConfigContext);
  return (
    <Textarea
      value={input as string}
      onChange={(e) => onChangeInput(e.target.value)}
      disabled={readOnly}
    />
  );
});
