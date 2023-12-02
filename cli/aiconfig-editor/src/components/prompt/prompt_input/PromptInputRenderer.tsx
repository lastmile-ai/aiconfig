import { Flex, Text } from "@mantine/core";
import { PromptInput } from "aiconfig";
import { memo } from "react";
import { PromptInputSchema } from "@/src/utils/promptUtils";
import PromptInputSchemaRenderer from "@/src/components/prompt/prompt_input/PromptInputSchemaRenderer";
import PromptInputConfigRenderer from "@/src/components/prompt/prompt_input/PromptInputConfigRenderer";

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
