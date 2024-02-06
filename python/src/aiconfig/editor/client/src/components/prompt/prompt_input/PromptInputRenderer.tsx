import { PromptInput } from "aiconfig";
import { memo, useCallback, useContext, useState } from "react";
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
import NotificationContext from "../../notifications/NotificationContext";

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
          Invalid input format for model. Toggle JSON editor to update. Set to
          {" {}"} in JSON editor and toggle back to reset.
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

  const { showNotification } = useContext(NotificationContext);

  const runPrompt = useCallback(async () => {
    if (isRunning) {
      showNotification({
        title: "Prompt already running",
        message:
          "Cannot run prompt while it is currently running. Click run button to cancel",
        type: "warning",
      });
      return;
    }

    if (isRunButtonDisabled) {
      // other prompt running, can't get here if readOnly
      showNotification({
        title: "Another prompt is running",
        message: "Cannot run prompt while another prompt is running",
        type: "warning",
      });
      return;
    }

    await onRunPrompt();
  }, [isRunButtonDisabled, isRunning, onRunPrompt, showNotification]);

  const runPromptButton = (
    // Wrap with a div to prevent it from expanding to input height
    <div className={classes.promptInputButtonWrapper}>
      <RunPromptButton
        isRunning={isRunning}
        disabled={isRunButtonDisabled}
        cancel={onCancelRun}
        runPrompt={runPrompt}
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
            runPrompt={runPrompt}
          />
        ) : (
          <PromptInputConfigRenderer
            input={input}
            onChangeInput={onChangeInput}
            runPrompt={runPrompt}
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
