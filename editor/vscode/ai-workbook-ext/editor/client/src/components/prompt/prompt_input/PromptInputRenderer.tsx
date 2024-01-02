import { PromptInput } from "aiconfig";
import { memo } from "react";
import { PromptInputSchema } from "../../../utils/promptUtils";
import PromptInputSchemaRenderer from "./schema_renderer/PromptInputSchemaRenderer";
import PromptInputConfigRenderer from "./PromptInputConfigRenderer";

type Props = {
  input: PromptInput;
  schema?: PromptInputSchema;
  onChangeInput: (value: PromptInput) => void;
};

export default memo(function PromptInputRenderer({
  input,
  schema,
  onChangeInput,
}: Props) {
  return schema ? (
    <PromptInputSchemaRenderer
      input={input}
      schema={schema}
      onChangeInput={onChangeInput}
    />
  ) : (
    <PromptInputConfigRenderer input={input} onChangeInput={onChangeInput} />
  );
});
