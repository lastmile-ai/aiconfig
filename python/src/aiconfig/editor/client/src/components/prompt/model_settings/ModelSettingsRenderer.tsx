import ModelSettingsSchemaRenderer from "./ModelSettingsSchemaRenderer";
import { GenericPropertiesSchema } from "../../../utils/promptUtils";
import { Flex, Text, createStyles } from "@mantine/core";
import { JSONObject, JSONValue } from "aiconfig";
import { memo, useState } from "react";
import JSONRenderer from "../../JSONRenderer";
import JSONEditorToggleButton from "../../JSONEditorToggleButton";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";

type Props = {
  settings?: JSONObject;
  schema?: GenericPropertiesSchema;
  onUpdateMissingRequiredFields: (
    fieldName: string,
    fieldValue: JSONValue
  ) => void;
  onUpdateModelSettings: (settings: Record<string, unknown>) => void;
};

const useStyles = createStyles(() => ({
  settingsContainer: {
    // TODO: Fix max height to be full height if input/output is larger than settings
    // otherwise bound to some reasonable height
    overflow: "auto",
    paddingTop: "0.5em",
    width: "100%",
  },
}));

type ErrorFallbackProps = {
  settings?: JSONObject;
  toggleJSONEditor: () => void;
};

function SettingsErrorFallback({
  settings,
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
        Invalid settings format for model. Toggle JSON editor to update
      </Text>
      <JSONRenderer content={settings} />
    </Flex>
  );
}

export default memo(function ModelSettingsRenderer({
  settings,
  schema,
  onUpdateMissingRequiredFields,
  onUpdateModelSettings,
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
    <Flex direction="column" className={classes.settingsContainer}>
      {isRawJSON || !schema ? (
        <>
          {/* // Only show the toggle if there is a schema to toggle between JSON and custom schema renderer */}
          {schema && rawJSONToggleButton}
          <JSONRenderer
            content={settings}
            onChange={(val) =>
              onUpdateModelSettings(val as Record<string, unknown>)
            }
            // schema={schema} TODO: Add schema after fixing z-index issue
          />
        </>
      ) : (
        <ErrorBoundary
          fallbackRender={() => (
            <SettingsErrorFallback
              settings={settings}
              toggleJSONEditor={() => setIsRawJSON(true)}
            />
          )}
        >
          {rawJSONToggleButton}
          <ModelSettingsSchemaRenderer
            settings={settings}
            schema={schema}
            onUpdateMissingRequiredFields={onUpdateMissingRequiredFields}
            onUpdateModelSettings={onUpdateModelSettings}
          />
        </ErrorBoundary>
      )}
    </Flex>
  );
});
