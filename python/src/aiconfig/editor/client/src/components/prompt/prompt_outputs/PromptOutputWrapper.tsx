import { ActionIcon, Flex, Tooltip } from "@mantine/core";
import { IconBraces, IconBracesOff } from "@tabler/icons-react";
import { Output } from "aiconfig";
import { memo, useState } from "react";
import JSONRenderer from "../../JSONRenderer";
import CopyButton from "../../CopyButton";

type Props = {
  children: React.ReactNode;
  copyContent?: string;
  output: Output;
  withRawJSONToggle?: boolean;
};

export default memo(function PromptOutputWrapper({
  children,
  copyContent,
  output,
  withRawJSONToggle = false,
}: Props) {
  const [isRawJSON, setIsRawJSON] = useState(false);
  return (
    <>
      <Flex justify="flex-end">
        {copyContent && <CopyButton value={copyContent} />}
        {withRawJSONToggle && (
          <Tooltip label="Toggle raw JSON" withArrow>
            <ActionIcon onClick={() => setIsRawJSON((curr) => !curr)}>
              {isRawJSON ? (
                <IconBracesOff size="1rem" />
              ) : (
                <IconBraces size="1rem" />
              )}
            </ActionIcon>
          </Tooltip>
        )}
      </Flex>
      {isRawJSON ? <JSONRenderer content={output} /> : <>{children}</>}
    </>
  );
});
