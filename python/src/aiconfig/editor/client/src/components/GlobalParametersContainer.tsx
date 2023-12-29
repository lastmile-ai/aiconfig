import { createStyles, Container, Accordion, Text } from "@mantine/core";
import { JSONObject } from "aiconfig";
import { memo, useCallback, useState } from "react";
import ParametersRenderer, { ParametersArray } from "./ParametersRenderer";

type Props = {
  initialValue: JSONObject;
  onUpdateParameters: (newParameters: any) => void;
};

const useStyles = createStyles((theme) => ({
  parametersContainer: {
    [theme.fn.smallerThan("sm")]: {
      padding: "0 0 200px 0",
    },
    paddingBottom: 50,
  },
}));

export default memo(function GlobalParametersContainer({
  initialValue,
  onUpdateParameters,
}: Props) {
  const [isParametersDrawerOpen, setIsParametersDrawerOpen] = useState(false);

  const updateGlobalParameters = useCallback(
    (data: {
      promptName?: string | undefined;
      newParameters: ParametersArray;
    }) => {
      const newParameters: Record<string, unknown> = {};
      for (const paramTuple of data.newParameters ?? []) {
        const key = paramTuple.parameterName;
        const val = paramTuple.parameterValue;

        newParameters[key] = val;
      }

      onUpdateParameters(newParameters);
    },
    [onUpdateParameters]
  );

  const { classes } = useStyles();

  return (
    <Container maw="80rem" className={classes.parametersContainer}>
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
            <Text color="blue">Global Variables (Parameters) {"{}"}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            {isParametersDrawerOpen && (
              <ParametersRenderer
                initialValue={initialValue}
                onUpdateParameters={updateGlobalParameters}
              />
            )}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Container>
  );
});
