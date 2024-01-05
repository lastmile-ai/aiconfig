import ModelSettingsConfigRenderer from "./ModelSettingsConfigRenderer";
import ModelSettingsSchemaRenderer from "./ModelSettingsSchemaRenderer";
import { GenericPropertiesSchema } from "../../../utils/promptUtils";
import { ActionIcon, Flex, Tooltip, createStyles } from "@mantine/core";
import { JSONObject } from "aiconfig";
import { memo, useState } from "react";
import { IconBraces, IconBracesOff } from "@tabler/icons-react";
import JSONRenderer from "../../JSONRenderer";

type Props = {
  settings?: JSONObject;
  schema?: GenericPropertiesSchema;
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

export default memo(function ModelSettingsRenderer({
  settings,
  schema,
  onUpdateModelSettings,
}: Props) {
  const { classes } = useStyles();
  const [isRawJSON, setIsRawJSON] = useState(schema == null);

  return (
    <Flex direction="column" className={classes.settingsContainer}>
      {/* // TODO: Refactor this out to a generic wrapper for toggling JSONRenderer or children component */}
      {/* // Only show the toggle if there is a schema to toggle between JSON and custom schema renderer */}
      {schema && (
        <Flex justify="flex-end">
          <Tooltip label="Toggle JSON editor" withArrow>
            <ActionIcon onClick={() => setIsRawJSON((curr) => !curr)}>
              {isRawJSON ? (
                <IconBracesOff size="1rem" />
              ) : (
                <IconBraces size="1rem" />
              )}
            </ActionIcon>
          </Tooltip>
        </Flex>
      )}
      {isRawJSON || !schema ? (
        <JSONRenderer
          content={settings}
          onChange={(val) =>
            onUpdateModelSettings(val as Record<string, unknown>)
          }
          // schema={schema} TODO: Add schema after fixing z-index issue
        />
      ) : (
        <ModelSettingsSchemaRenderer
          settings={settings}
          schema={schema}
          onUpdateModelSettings={onUpdateModelSettings}
        />
      )}
    </Flex>
  );
});
