import { Error, ExecuteResult, Output } from "aiconfig";
import { memo } from "react";

type Props = {
  outputs: Output[];
};

const ErrorOutput = memo(function ErrorOutput({ output }: { output: Error }) {
  return <div>{output.evalue}</div>;
});

const ExecuteResultOutput = memo(function ExecuteResultOutput({
  output,
}: {
  output: ExecuteResult;
}) {
  return null;
  // switch (output.renderData.type) {
  //   case "text":
  //     return <TextRenderer content={output.renderData.text} />;
  //   // TODO: Handle other types of outputs
  // }
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
