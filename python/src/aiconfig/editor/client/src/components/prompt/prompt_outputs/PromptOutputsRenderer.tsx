import {
  Error,
  ExecuteResult,
  JSONValue,
  Output,
  OutputDataWithToolCallsValue,
  OutputDataWithValue,
} from "aiconfig";
import { memo } from "react";
import { TextRenderer } from "../TextRenderer";
import { Prism } from "@mantine/prism";
import { ActionIcon, CopyButton, Flex, Tooltip } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";

type Props = {
  outputs: Output[];
};

function ErrorOutput({ output }: { output: Error }) {
  return <div>{output.evalue}</div>;
}

function JSONOutput({ content }: { content: JSONValue }) {
  return (
    <Prism language="json" styles={{ code: { textWrap: "pretty" } }}>
      {JSON.stringify(content, null, 2)}
    </Prism>
  );
}

function CopiableOutput({
  copyContent,
  children,
}: {
  copyContent: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Flex justify="flex-end">
        <CopyButton value={copyContent} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? "Copied" : "Copy"} withArrow>
              <ActionIcon color={copied ? "teal" : "gray"} onClick={copy}>
                {copied ? <IconCheck size="1rem" /> : <IconCopy size="1rem" />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Flex>
      {children}
    </>
  );
}

const ExecuteResultOutput = memo(function ExecuteResultOutput({
  output,
}: {
  output: ExecuteResult;
}) {
  if (output.data == null) {
    return <JSONOutput content={output} />;
  }

  if (typeof output.data === "string") {
    return (
      <CopiableOutput copyContent={output.data}>
        <TextRenderer content={output.data} />
      </CopiableOutput>
    );
  } else if (
    typeof output.data === "object" &&
    output.data.hasOwnProperty("kind")
  ) {
    switch ((output.data as OutputDataWithValue).kind) {
      case "tool_calls":
      // TODO: Tool calls rendering
      default:
        return (
          <JSONOutput
            content={(output.data as OutputDataWithToolCallsValue).value}
          />
        );
    }
  }

  return <JSONOutput content={output.data} />;
});

const OutputRenderer = memo(function Output({ output }: { output: Output }) {
  // TODO: Add toggle for raw JSON renderer
  switch (output.output_type) {
    case "execute_result":
      return <ExecuteResultOutput output={output} />;
    case "error":
      return <ErrorOutput output={output} />;
  }
});

export default memo(function PromptOutputsRenderer({ outputs }: Props) {
  return outputs.map((output, i) => <OutputRenderer key={i} output={output} />);
});
