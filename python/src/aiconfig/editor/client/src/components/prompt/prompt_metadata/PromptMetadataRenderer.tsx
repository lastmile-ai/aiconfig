import { GenericPropertiesSchema } from "../../../utils/promptUtils";
import { memo, useState } from "react";
import JSONRenderer from "../../JSONRenderer";
import { JSONObject } from "aiconfig";
import { Flex, Text, createStyles } from "@mantine/core";
import JSONEditorToggleButton from "../../JSONEditorToggleButton";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";
import PromptMetadataSchemaRenderer from "./PromptMetadataSchemaRenderer";

type Props = {
  metadata?: JSONObject;
  onUpdatePromptMetadata: (metadata: JSONObject) => void;
  schema?: GenericPropertiesSchema;
};

const useStyles = createStyles(() => ({
  metadataContainer: {
    overflow: "auto",
    paddingTop: "0.5em",
    width: "100%",
  },
}));

type ErrorFallbackProps = {
  metadata?: JSONObject;
  toggleJSONEditor: () => void;
};

function MetadataErrorFallback({
  metadata,
  toggleJSONEditor,
}: ErrorFallbackProps) {
  const { resetBoundary: clearRenderError } = useErrorBoundary();
  return (
    <Flex direction="column">
      <Text color="red" size="sm">
        <Flex justify="flex-end">
          <JSONEditorToggleButton
            isRawJSON={false}
            setIsRawJSON={() => {
              clearRenderError();
              toggleJSONEditor();
            }}
          />
        </Flex>
        Invalid metadata format for model. Toggle JSON editor to update. Set to
        {" {}"} in JSON editor and toggle back to reset.
      </Text>
      <JSONRenderer content={metadata} />
    </Flex>
  );
}

export default memo(function PromptMetadataRenderer({
  metadata,
  onUpdatePromptMetadata,
  schema,
}: Props) {
  const { classes } = useStyles();
  const [isRawJSON, setIsRawJSON] = useState(schema == null);

  const rawJSONToggleButton = (
    <Flex justify="flex-end">
      <JSONEditorToggleButton
        isRawJSON={isRawJSON}
        setIsRawJSON={setIsRawJSON}
      />
    </Flex>
  );

  return (
    <Flex direction="column" className={classes.metadataContainer}>
      {isRawJSON || !schema ? (
        <>
          {/* // Only show the toggle if there is a schema to toggle between JSON and custom schema renderer */}
          {schema && rawJSONToggleButton}
          <JSONRenderer
            content={metadata}
            onChange={(val) =>
              onUpdatePromptMetadata(val as Record<string, unknown>)
            }
          />
        </>
      ) : (
        <ErrorBoundary
          fallbackRender={() => (
            <MetadataErrorFallback
              metadata={metadata}
              toggleJSONEditor={() => setIsRawJSON(true)}
            />
          )}
        >
          {rawJSONToggleButton}
          <PromptMetadataSchemaRenderer
            metadata={metadata}
            schema={schema}
            onUpdatePromptMetadata={onUpdatePromptMetadata}
          />
        </ErrorBoundary>
      )}
    </Flex>
  );
});
