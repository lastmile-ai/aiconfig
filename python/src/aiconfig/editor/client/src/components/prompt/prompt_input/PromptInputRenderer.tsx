import { PromptInput } from "aiconfig";
import { memo, useState } from "react";
import { PromptInputSchema } from "../../../utils/promptUtils";
import PromptInputSchemaRenderer from "./schema_renderer/PromptInputSchemaRenderer";
import PromptInputConfigRenderer from "./PromptInputConfigRenderer";
import { Flex } from "@mantine/core";
import PromptInputJSONRenderer from "./PromptInputJSONRenderer";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";
import { Text } from "@mantine/core";
import JSONRenderer from "../../JSONRenderer";
import JSONEditorToggleButton from "../../JSONEditorToggleButton";

type Props = {
  input: PromptInput;
  schema?: PromptInputSchema;
  onChangeInput: (value: PromptInput) => void;
};

type ErrorFallbackProps = {
  input: PromptInput;
  toggleJSONEditor: () => void;
};

function InputErrorFallback({ input, toggleJSONEditor }: ErrorFallbackProps) {
  const { resetBoundary: clearRenderError } = useErrorBoundary();
  return (
    <Flex direction="column">
      <Text color="red" size="sm">
        Invalid input format for model. Toggle JSON editor to update
      </Text>
      <JSONRenderer content={input} />
      <Flex justify="flex-end">
        <JSONEditorToggleButton
          isRawJSON={false}
          setIsRawJSON={() => {
            clearRenderError();
            toggleJSONEditor();
          }}
        />
      </Flex>
    </Flex>
  );
}

export default memo(function PromptInputRenderer({
  input,
  schema,
  onChangeInput,
}: Props) {
  const [isRawJSON, setIsRawJSON] = useState(false);
  const rawJSONToggleButton = (
    <Flex justify="flex-end">
      <JSONEditorToggleButton
        isRawJSON={isRawJSON}
        setIsRawJSON={setIsRawJSON}
      />
    </Flex>
  );
  return (
    <>
      {isRawJSON ? (
        <>
          <PromptInputJSONRenderer
            input={input}
            onChangeInput={onChangeInput}
          />

          {rawJSONToggleButton}
        </>
      ) : (
        <ErrorBoundary
          fallbackRender={() => (
            <InputErrorFallback
              input={input}
              toggleJSONEditor={() => setIsRawJSON(true)}
            />
          )}
        >
          <>
            {schema ? (
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
            {rawJSONToggleButton}
          </>
        </ErrorBoundary>
      )}
    </>
  );
});
