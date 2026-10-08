import {
  PropertyRendererProps,
  SetStateFn,
  StateSetFromPrevFn,
} from "../SettingsPropertyRenderer";
import { Flex, SegmentedControl } from "@mantine/core";
import { JSONObject, JSONValue } from "aiconfig";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

// TODO: Can we type prompt schema / all supported properties exhaustively?
export type UnionProperty = {
  type: "union";
  types: JSONObject[];
};

function valueMatchesSchemaType(value: JSONValue, schema: JSONObject): boolean {
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    return false;
  }
  switch (schema.type) {
    case "string":
    case "text":
      return typeof value === "string";
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "number":
      return typeof value === "number";
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return (
        Array.isArray(value) &&
        (!schema.items ||
          value.every((item) =>
            valueMatchesSchemaType(item, schema.items as JSONObject)
          ))
      );
    case "object":
    case "map":
      return value !== null && typeof value === "object" && !Array.isArray(value);
    case "null":
      return value === null;
    default:
      return false;
  }
}

type Props = {
  disabled?: boolean;
  property: UnionProperty;
  propertyName: string;
  initialValue?: JSONValue; // TODO: Handle initial value, selecting correct tab to show
  isRequired?: boolean;
  setValue: SetStateFn;
  renderProperty: (props: PropertyRendererProps) => JSX.Element;
};

export default memo(function UnionPropertyControl(props: Props) {
  const {
    disabled,
    property,
    renderProperty,
    setValue,
    ...renderPropertyProps
  } = props;

  const segmentedTabs = useMemo(
    () =>
      property.types.map((schema, i) => ({
        label:
          Array.isArray(schema.enum) && schema.enum.length > 0
            ? schema.enum.join(" / ")
            : (schema.type as string) ?? `Option ${i + 1}`,
        value: i.toString(),
      })),
    [property.types]
  );

  const matchingIndex =
    renderPropertyProps.initialValue === undefined
      ? -1
      : property.types.findIndex((schema) =>
          valueMatchesSchemaType(renderPropertyProps.initialValue!, schema)
        );
  const initialTab = (matchingIndex < 0 ? 0 : matchingIndex).toString();
  const [controlledData, setControlledData] = useState(() => {
    const values = new Map<string, JSONValue>();
    if (renderPropertyProps.initialValue !== undefined) {
      values.set(initialTab, renderPropertyProps.initialValue);
    }
    return values;
  });
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (renderPropertyProps.initialValue === undefined) {
      return;
    }
    const index = property.types.findIndex((schema) =>
      valueMatchesSchemaType(renderPropertyProps.initialValue!, schema)
    );
    if (index < 0) {
      return;
    }
    const tab = index.toString();
    setActiveTab(tab);
    setControlledData((prev) =>
      new Map(prev).set(tab, renderPropertyProps.initialValue!)
    );
  }, [renderPropertyProps.initialValue, property.types]);

  const selectTab = useCallback(
    (tab: string) => {
      if (controlledData.has(tab)) {
        setValue(controlledData.get(tab)!);
      }
      setActiveTab(tab);
    },
    [controlledData, setValue]
  );

  const setPropertyValue: SetStateFn = useCallback(
    (value: StateSetFromPrevFn | JSONValue) => {
      const newValue =
        typeof value === "function" ? value(controlledData) : value;
      setControlledData((prev) => new Map(prev).set(activeTab, newValue));
      setValue(newValue);
    },
    [activeTab, controlledData, setValue]
  );

  return (
    <Flex direction="column">
      <SegmentedControl
        data={segmentedTabs}
        value={activeTab}
        onChange={selectTab}
        disabled={disabled}
      />
      <div key={activeTab} style={{ marginLeft: "1em" }}>
        {renderProperty({
          ...renderPropertyProps,
          property: property.types[parseInt(activeTab)],
          initialValue: controlledData.get(activeTab),
          setValue: setPropertyValue,
          propertyName: "",
        })}
      </div>
    </Flex>
  );
});
