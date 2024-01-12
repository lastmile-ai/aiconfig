import {
  PropertyRendererProps,
  SetStateFn,
  StateSetFromPrevFn,
} from "../SettingsPropertyRenderer";
import { Flex, SegmentedControl } from "@mantine/core";
import { JSONObject, JSONValue } from "aiconfig";
import { memo, useCallback, useMemo, useState } from "react";

// TODO: Can we type prompt schema / all supported properties exhaustively?
export type UnionProperty = {
  type: "union";
  types: JSONObject[];
};

type Props = {
  property: UnionProperty;
  propertyName: string;
  initialValue?: JSONValue; // TODO: Handle initial value, selecting correct tab to show
  isRequired?: boolean;
  onUpdateMissingRequiredFields: (
    fieldName: string,
    fieldValue: JSONValue
  ) => void;
  setValue: SetStateFn;
  renderProperty: (props: PropertyRendererProps) => JSX.Element;
};

export default memo(function UnionPropertyControl(props: Props) {
  const {
    property,
    propertyName,
    isRequired,
    onUpdateMissingRequiredFields,
    renderProperty,
    setValue,
    ...renderPropertyProps
  } = props;

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
      console.log("set value: ", controlledData.get(tab));
      setValue(controlledData.get(tab));
      setActiveTab(tab);
    },
    [controlledData, setValue]
  );

  const setPropertyValue: SetStateFn = useCallback(
    (value: StateSetFromPrevFn | JSONValue) => {
      const newValue =
        typeof value === "function" ? value(controlledData) : value;
      setControlledData((prev) => prev.set(activeTab, newValue));
      setValue(newValue);
      if (isRequired) {
        onUpdateMissingRequiredFields(propertyName, newValue);
      }
    },
    [
      activeTab,
      controlledData,
      isRequired,
      onUpdateMissingRequiredFields,
      propertyName,
      setValue,
    ]
  );

  return (
    <Flex direction="column">
      <SegmentedControl
        data={segmentedTabs}
        value={activeTab}
        onChange={selectTab}
      />
      <div style={{ marginLeft: "1em" }}>
        {renderProperty({
          ...renderPropertyProps,
          property: property.types[parseInt(activeTab)],
          propertyName: "",
          onUpdateMissingRequiredFields,
          setValue: setPropertyValue,
        })}
      </div>
    </Flex>
  );
});
