import {
  PropertyRendererProps,
  SetStateFn,
} from "@/src/components/SettingsPropertyRenderer";
import {
  ActionIcon,
  Group,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { IconHelp, IconPlus, IconTrash } from "@tabler/icons-react";
import { JSONObject } from "aiconfig";
import { uniqueId } from "lodash";
import { memo, useCallback, useState } from "react";

export type MapProperty = {
  type: "map";
  keys: {
    type: string;
  };
  items: JSONObject;
};

type Props = {
  property: MapProperty;
  propertyName: string;
  initialValue?: any;
  isRequired?: boolean;
  setValue: SetStateFn;
  propertyDescription?: string;
  renderProperty: (props: PropertyRendererProps) => JSX.Element;
};

export default memo(function MapPropertyControl({
  property,
  renderProperty,
  initialValue,
  setValue,
  propertyName,
  propertyDescription,
}: Props) {
  const [itemValues, setItemValues] = useState<
    Map<string, { key?: string; value?: any }>
  >(
    new Map(
      Object.entries(initialValue ?? {}).map(([key, value]) => [
        uniqueId(), // key
        { key, value }, // map values are the key-value pairs defined in the settings
      ])
    )
  );

  const removeItemFromMap = useCallback(
    (key: string) => {
      let newMapValue;
      setItemValues((prev) => {
        prev.delete(key);
        newMapValue = new Map(prev);
        return newMapValue;
      });
      const newValue: { [key: string]: string } = {};
      for (const { key, value } of newMapValue!.values()) {
        newValue[key] = value;
      }
      setValue(newValue);
    },
    [setValue]
  );

  const addItemToMap = useCallback(() => {
    setItemValues((prev) => {
      const newValue = new Map(prev);
      newValue.set(uniqueId(), { key: "", value: undefined });
      return newValue;
    });
  }, []);

  const updateKey = useCallback(
    (mapKey: string, itemKey: string) => {
      let newMapValue;
      setItemValues((prev) => {
        newMapValue = new Map(prev);
        const item = { key: itemKey, value: newMapValue.get(mapKey)?.value };
        newMapValue.set(mapKey, item);
        return newMapValue;
      });

      const newValue: { [key: string]: string } = {};
      for (const { key, value } of newMapValue!.values()) {
        newValue[key] = value;
      }
      setValue(newValue);
    },
    [setValue]
  );

  const updateValue = useCallback(
    (mapKey: string, value: any) => {
      let newMapValue;
      setItemValues((prev) => {
        newMapValue = new Map(prev);
        const item = { key: newMapValue.get(mapKey)?.key, value };
        newMapValue.set(mapKey, item);
        return newMapValue;
      });

      const newValue: { [key: string]: string } = {};
      for (const { key, value } of newMapValue!.values()) {
        newValue[key] = value;
      }
      setValue(newValue);
    },
    [setValue]
  );

  return (
    <>
      <Group align="end">
        <Text size="md">{propertyName}</Text>
        {propertyDescription != null && propertyDescription.trim() !== "" ? (
          <Tooltip label={propertyDescription} multiline>
            <ActionIcon>
              <IconHelp size={16} />
            </ActionIcon>
          </Tooltip>
        ) : null}
        <ActionIcon onClick={() => addItemToMap()}>
          <IconPlus size={16} />
        </ActionIcon>
      </Group>
      <Stack>
        {Array.from(itemValues.entries()).map(([key, item]) => (
          <Group
            key={key}
            ml="1em"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0fr" }}
          >
            <TextInput
              onChange={(event) => updateKey(key, event.currentTarget.value)}
              value={item.key}
              placeholder="key"
              radius="md"
            />
            {renderProperty({
              propertyName: "",
              property: property.items,
              setValue: (value) => updateValue(key, value),
            })}
            <ActionIcon
              onClick={() => removeItemFromMap(key)}
              style={{ flex: 0 }}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        ))}
      </Stack>
    </>
  );
});
