import { PromptInput } from "aiconfig";
import { memo, useState } from "react";
import { PromptInputSchema } from "../../../utils/promptUtils";
import PromptInputSchemaRenderer from "./schema_renderer/PromptInputSchemaRenderer";
import PromptInputConfigRenderer from "./PromptInputConfigRenderer";
import { ActionIcon, Flex, Tooltip } from "@mantine/core";
import { IconBraces, IconBracesOff } from "@tabler/icons-react";
import PromptInputJSONRenderer from "./PromptInputJSONRenderer";

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
  const [isRawJSON, setIsRawJSON] = useState(false);
  return (
    <>
      {isRawJSON ? (
        <PromptInputJSONRenderer input={input} onChangeInput={onChangeInput} />
      ) : schema ? (
        <PromptInputSchemaRenderer
          input={input}
          schema={schema}
          onChangeInput={onChangeInput}
        />
      ) : (
        <PromptInputConfigRenderer
          input={input}
          onChangeInput={onChangeInput}
        />
      )}
      <Flex justify="flex-end">
        <Tooltip label="Toggle JSON editor" withArrow>
          <ActionIcon onClick={() => setIsRawJSON((curr) => !curr)}>
            {isRawJSON ? (
              <IconBracesOff size="1rem" />
            ) : (
              <IconBraces size="1rem" />
            )}
          </ActionIcon>
        </Tooltip>
      </Flex>
    </>
  );
});
