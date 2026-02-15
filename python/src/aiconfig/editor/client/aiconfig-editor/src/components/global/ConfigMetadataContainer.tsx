import { Accordion, Text, createStyles } from "@mantine/core";
import { JSONObject } from "aiconfig";
import { memo, useContext, useState } from "react";
import AIConfigContext from "../../contexts/AIConfigContext";
import { PROMPT_CELL_LEFT_MARGIN_PX } from "../../utils/constants";
import ParametersRenderer from "../ParametersRenderer";
import GlobalModelSettingsRenderer from "./GlobalModelSettingsRenderer";

type Props = {
  onDeleteModelSettings?: (modelName: string) => void;
  getModels?: (search?: string) => Promise<string[]>;
  metadata: JSONObject;
  onUpdateModelSettings: (
    modelName: string,
    newModelSettings: JSONObject
  ) => void;
  onUpdateParameters: (newParameters: JSONObject) => void;
};

const useStyles = createStyles(() => ({
  configMetadataContainer: {
    margin: `16px auto 16px ${PROMPT_CELL_LEFT_MARGIN_PX}px`,
  },
  configMetadataContainerReadonly: {
    margin: "16px auto",
  },
}));

export default memo(function ConfigMetadataContainer({
  getModels,
  metadata,
  onDeleteModelSettings,
  onUpdateModelSettings,
  onUpdateParameters,
}: Props) {
  const { classes } = useStyles();
  const { readOnly } = useContext(AIConfigContext);
  const [openPanel, setOpenPanel] = useState<string | null>(null);

  return (
    // Set local and global classname. Global will override if specified
    // Local is readonly or not. Global will always have configMetadataContainer class
    // and if readonly, will also have configMetadataContainerReadonly class (to allow overrides)
    <div
      className={`${
        readOnly
          ? classes.configMetadataContainerReadonly
          : classes.configMetadataContainer
      } configMetadataContainer ${
        readOnly ? "configMetadataContainerReadonly" : ""
      }`}
    >
      <Accordion
        styles={{
          item: { borderBottom: 0 },
          label: {
            textAlign: "center",
            paddingTop: "0.5em",
            paddingBottom: "0.5em",
            fontSize: "0.85em",
          },
        }}
        onChange={(value) => setOpenPanel(value)}
      >
        <Accordion.Item value="modelSettings">
          <Accordion.Control>
            <Text color="blue">Global Model Settings</Text>
          </Accordion.Control>
          <Accordion.Panel>
            {openPanel === "modelSettings" && (
              <GlobalModelSettingsRenderer
                deleteModelSettings={onDeleteModelSettings}
                getModels={getModels}
                modelSettings={metadata?.models ?? {}}
                onUpdateModelSettings={onUpdateModelSettings}
              />
            )}
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="parameters">
          <Accordion.Control>
            <Text color="blue">Global Parameters {"{}"}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            {openPanel === "parameters" && (
              <ParametersRenderer
                initialValue={metadata?.parameters ?? {}}
                onUpdateParameters={onUpdateParameters}
                maxHeight="300px"
              />
            )}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
});
