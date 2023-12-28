import {
  Error,
  ExecuteResult,
  Output,
  OutputDataWithToolCallsValue,
  OutputDataWithValue,
} from "aiconfig";
import { memo } from "react";
import { TextRenderer } from "../TextRenderer";
import JSONOutput from "./JSONOutput";
import PromptOutputWrapper from "./PromptOutputWrapper";

type Props = {
  outputs: Output[];
};

function ErrorOutput({ output }: { output: Error }) {
  return <div>{output.evalue}</div>;
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
      <PromptOutputWrapper
        copyContent={output.data}
        output={output}
        withRawJSONToggle
      >
        <TextRenderer content={output.data} />
      </PromptOutputWrapper>
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
