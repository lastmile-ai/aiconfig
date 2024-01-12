import { PromptInput } from "aiconfig";
import { memo, useState } from "react";
import { PromptInputSchema } from "../../../utils/promptUtils";
import PromptInputSchemaRenderer from "./schema_renderer/PromptInputSchemaRenderer";
import PromptInputConfigRenderer from "./PromptInputConfigRenderer";
import { Flex, createStyles } from "@mantine/core";
import PromptInputJSONRenderer from "./PromptInputJSONRenderer";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";
import { Text } from "@mantine/core";
import JSONRenderer from "../../JSONRenderer";
import JSONEditorToggleButton from "../../JSONEditorToggleButton";
import RunPromptButton from "../RunPromptButton";

type Props = {
  input: PromptInput;
  schema?: PromptInputSchema;
  onChangeInput: (value: PromptInput) => void;
  onCancelRun: () => Promise<void>;
  onRunPrompt: () => Promise<void>;
  isRunning?: boolean;
  isRunButtonDisabled?: boolean;
};

type ErrorFallbackProps = {
  input: PromptInput;
  toggleJSONEditor: () => void;
  renderRunButton: () => JSX.Element;
};

const useStyles = createStyles(() => ({
  promptInputButtonWrapper: {
    marginLeft: "4px",
  },
  promptInputRendererWrapper: {
    width: "100%",
  },
}));

function InputErrorFallback({
  input,
  toggleJSONEditor,
  renderRunButton,
}: ErrorFallbackProps) {
  const { classes } = useStyles();
  const { resetBoundary: clearRenderError } = useErrorBoundary();
  return (
    <>
      <Flex direction="column">
        <Text color="red" size="sm">
          Invalid input format for model. Toggle JSON editor to update
        </Text>
        <Flex>
          <div className={classes.promptInputRendererWrapper}>
            <JSONRenderer content={input} />
          </div>
          {renderRunButton()}
        </Flex>
      </Flex>
      <Flex justify="flex-end">
        <JSONEditorToggleButton
          isRawJSON={false}
          setIsRawJSON={() => {
            clearRenderError();
            toggleJSONEditor();
          }}
        />
      </Flex>
    </>
  );
}

export default memo(function PromptInputRenderer({
  input,
  schema,
  onChangeInput,
  onCancelRun,
  onRunPrompt,
  isRunning = false,
  isRunButtonDisabled = false,
}: Props) {
  const { classes } = useStyles();

  const [isRawJSON, setIsRawJSON] = useState(false);
  const rawJSONToggleButton = (
    <Flex justify="flex-end">
      <JSONEditorToggleButton
        isRawJSON={isRawJSON}
        setIsRawJSON={setIsRawJSON}
      />
    </Flex>
  );

  const runPromptButton = (
    // Wrap with a div to prevent it from expanding to input height
    <div className={classes.promptInputButtonWrapper}>
      <RunPromptButton
        disabled={isRunButtonDisabled}
        isRunning={isRunning}
        cancel={onCancelRun}
        runPrompt={onRunPrompt}
      />
    </div>
  );

  const nonJSONRenderer = (
    <Flex>
      <div className={classes.promptInputRendererWrapper}>
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
      </div>
      {runPromptButton}
    </Flex>
  );

  return (
    <>
      {isRawJSON ? (
        <>
          <Flex>
            <PromptInputJSONRenderer
              input={input}
              onChangeInput={onChangeInput}
            />
            {runPromptButton}
          </Flex>
          <Flex justify="flex-end">{rawJSONToggleButton}</Flex>
        </>
      ) : (
        <ErrorBoundary
          fallbackRender={() => (
            <InputErrorFallback
              input={input}
              // Fallback is only shown when an error occurs in non-JSON renderer
              // so toggle must be to JSON editor
              toggleJSONEditor={() => setIsRawJSON(true)}
              renderRunButton={() => runPromptButton}
            />
          )}
        >
          {nonJSONRenderer}
          <Flex justify="flex-end">{rawJSONToggleButton}</Flex>
        </ErrorBoundary>
      )}
    </>
  );
});
