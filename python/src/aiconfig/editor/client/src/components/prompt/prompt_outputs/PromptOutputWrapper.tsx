import { ActionIcon, CopyButton, Flex, Tooltip } from "@mantine/core";
import {
  IconBraces,
  IconBracesOff,
  IconCheck,
  IconCopy,
} from "@tabler/icons-react";
import { Output } from "aiconfig";
import { memo, useState } from "react";
import JSONOutput from "./JSONOutput";

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
        {copyContent && (
          <CopyButton value={copyContent} timeout={2000}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? "Copied" : "Copy"} withArrow>
                <ActionIcon color={copied ? "teal" : "gray"} onClick={copy}>
                  {copied ? (
                    <IconCheck size="1rem" />
                  ) : (
                    <IconCopy size="1rem" />
                  )}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        )}
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
      {isRawJSON ? <JSONOutput content={output} /> : <>{children}</>}
    </>
  );
});
