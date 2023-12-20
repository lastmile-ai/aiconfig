import { PropertyRendererProps } from "@/src/components/SettingsPropertyRenderer";
import { Container, Flex, Group, SegmentedControl, Stack } from "@mantine/core";
import { JSONObject } from "aiconfig";
import { memo, useCallback, useMemo, useState } from "react";

// TODO: Can we type prompt schema / all supported properties exhaustively?
export type UnionProperty = {
  type: "union";
  types: JSONObject[];
};

type Props = {
  property: UnionProperty;
  propertyName: string;
  initialValue?: any; // TODO: Handle initial value, selecting correct tab to show
  isRequired?: boolean;
  setValue: (value: any) => void;
  renderProperty: (props: PropertyRendererProps) => JSX.Element;
};

export default memo(function UnionPropertyControl(props: Props) {
  const { property, renderProperty, setValue, ...renderPropertyProps } = props;

  const segmentedTabs = useMemo(
    () =>
      property.types.map((_prop, i) => ({
        label: "",
        value: i.toString(),
      })),
    [property.types]
  );

  const [controlledData, setControlledData] = useState(new Map());
  const [activeTab, setActiveTab] = useState("0");

  const selectTab = useCallback(
    (tab: string) => {
      setValue(controlledData.get(tab));
      setActiveTab(tab);
    },
    [controlledData, setValue]
  );

  const setPropertyValue = useCallback(
    (value: any) => {
      setControlledData((prev) => prev.set(activeTab, value));
      setValue(value);
    },
    [activeTab, setValue]
  );

  console.log("controlled data: ", controlledData);

  return (
    <Flex direction="column">
      <SegmentedControl
        data={segmentedTabs}
        value={activeTab}
        onChange={selectTab}
      />
      <div style={{ marginLeft: "0.5em" }}>
        {props.renderProperty({
          ...renderPropertyProps,
          property: property.types[parseInt(activeTab)],
          setValue: setPropertyValue,
          propertyName: "",
        })}
      </div>
    </Flex>
  );
});
