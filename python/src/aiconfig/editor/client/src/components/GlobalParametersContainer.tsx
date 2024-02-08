import { Accordion, Text, createStyles } from "@mantine/core";
import { JSONObject } from "aiconfig";
import { memo, useContext, useState } from "react";
import ParametersRenderer from "./ParametersRenderer";
import AIConfigContext from "../contexts/AIConfigContext";
import { PROMPT_CELL_LEFT_MARGIN_PX } from "../utils/constants";

type Props = {
  initialValue: JSONObject;
  onUpdateParameters: (newParameters: JSONObject) => void;
};

const useStyles = createStyles(() => ({
  parametersContainer: {
    margin: `16px auto 16px ${PROMPT_CELL_LEFT_MARGIN_PX}px`,
  },
  parametersContainerReadonly: {
    margin: "16px auto",
  },
}));

export default memo(function GlobalParametersContainer({
  initialValue,
  onUpdateParameters,
}: Props) {
  const [isParametersDrawerOpen, setIsParametersDrawerOpen] = useState(false);

  const { classes } = useStyles();
  const { readOnly } = useContext(AIConfigContext);

  return (
    // Set local and global classname. Global will override if specified
    // Local is readonly or not. Global will always have parametersContainer class
    // and if readonly, will also have parametersContainerReadonly class (to allow overrides)
    <div
      className={`${
        readOnly
          ? classes.parametersContainerReadonly
          : classes.parametersContainer
      } parametersContainer ${readOnly ? "parametersContainerReadonly" : ""}`}
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
        onChange={(value) => setIsParametersDrawerOpen(value === "parameters")}
      >
        <Accordion.Item value="parameters">
          <Accordion.Control>
            <Text color="blue">Global Parameters {"{}"}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            {isParametersDrawerOpen && (
              <ParametersRenderer
                initialValue={initialValue}
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
