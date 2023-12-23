import { Error } from "aiconfig";
import { ClientExecuteResult, ClientPromptOutput } from "../../../shared/types";
import { memo } from "react";
import { TextRenderer } from "../TextRenderer";

type Props = {
  outputs: ClientPromptOutput[];
};

const ErrorOutput = memo(function ErrorOutput({ output }: { output: Error }) {
  return <div>{output.evalue}</div>;
});

const ExecuteResultOutput = memo(function ExecuteResultOutput({
  output,
}: {
  output: ClientExecuteResult;
}) {
  return null;
  // switch (output.renderData.type) {
  //   case "text":
  //     return <TextRenderer content={output.renderData.text} />;
  //   // TODO: Handle other types of outputs
  // }
});

const Output = memo(function Output({
  output,
}: {
  output: ClientPromptOutput;
}) {
  switch (output.output_type) {
    case "execute_result":
      return <ExecuteResultOutput output={output} />;
    case "error":
      return <ErrorOutput output={output} />;
  }
});

export default memo(function PromptOutputsRenderer({ outputs }: Props) {
  return outputs.map((output, i) => <Output key={i} output={output} />);
});
