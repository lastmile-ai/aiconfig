import ModelSettingsConfigRenderer from "./ModelSettingsConfigRenderer";
import ModelSettingsSchemaRenderer from "./ModelSettingsSchemaRenderer";
import { GenericPropertiesSchema } from "../../../utils/promptUtils";
import { Flex, createStyles } from "@mantine/core";
import { JSONObject } from "aiconfig";
import { memo } from "react";

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
  let settingsComponent;

  if (schema) {
    settingsComponent = (
      <ModelSettingsSchemaRenderer
        settings={settings}
        schema={schema}
        onUpdateModelSettings={onUpdateModelSettings}
      />
    );
  } else if (settings) {
    settingsComponent = <ModelSettingsConfigRenderer settings={settings} />;
  }

  return (
    <Flex direction="column" className={classes.settingsContainer}>
      {settingsComponent}
    </Flex>
  );
});
