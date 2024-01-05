import {
  Error,
  ExecuteResult,
  Output,
  OutputDataWithToolCallsValue,
  OutputDataWithValue,
} from "aiconfig";
import { memo } from "react";
import { TextRenderer } from "../TextRenderer";
import PromptOutputWrapper from "./PromptOutputWrapper";
import MimeTypeRenderer from "../../MimeTypeRenderer";
import JSONRenderer from "../../JSONRenderer";

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
    return <JSONRenderer content={output} />;
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
    !Array.isArray(output.data) &&
    Object.prototype.hasOwnProperty.call(output.data, "kind")
  ) {
    switch ((output.data as OutputDataWithValue).kind) {
      case "file_uri":
        return (
          <PromptOutputWrapper
            copyContent={(output.data as OutputDataWithValue).value as string}
            output={output}
            withRawJSONToggle
          >
            <MimeTypeRenderer
              mimeType={output.mime_type}
              content={(output.data as OutputDataWithValue).value as string}
            />
          </PromptOutputWrapper>
        );
      case "base64":
        return (
          <PromptOutputWrapper
            copyContent={(output.data as OutputDataWithValue).value as string}
            output={output}
            withRawJSONToggle
          >
            <MimeTypeRenderer
              mimeType={output.mime_type}
              content={`data:${output.mime_type};base64, ${
                (output.data as OutputDataWithValue).value as string
              }`}
            />
          </PromptOutputWrapper>
        );
      // TODO: Tool calls rendering
      default:
        return (
          <JSONRenderer
            content={(output.data as OutputDataWithToolCallsValue).value}
          />
        );
    }
  }

  return <JSONRenderer content={output.data} />;
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
