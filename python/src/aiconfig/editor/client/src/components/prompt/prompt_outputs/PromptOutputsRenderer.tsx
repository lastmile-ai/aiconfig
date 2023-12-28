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

type Props = {
  outputs: Output[];
};

function ErrorOutput({ output }: { output: Error }) {
  return <div>{output.evalue}</div>;
}

function JSONOutput({ content }: { content: JSONValue }) {
  return <Prism language="json">{JSON.stringify(content, null, 2)}</Prism>;
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
    return <TextRenderer content={output.data} />;
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
