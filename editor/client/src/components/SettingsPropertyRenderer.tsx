import {
  Text,
  Group,
  Stack,
  Autocomplete,
  Tooltip,
  NumberInput,
  TextInput,
  Slider,
  Checkbox,
  ActionIcon,
  Textarea,
  AutocompleteItem,
  Select,
} from "@mantine/core";
import { useState, useCallback, useRef } from "react";
import { uniqueId } from "lodash";
import { IconHelp, IconPlus, IconTrash } from "@tabler/icons-react";
import UnionPropertyControl, {
  UnionProperty,
} from "./property_controls/UnionPropertyControl";

type StateSetFromPrevFn = (prev: any) => void;
export type SetStateFn = (val: StateSetFromPrevFn | any) => void;

export type PropertyRendererProps = {
  propertyName: string;
  property: { [key: string]: any };
  isRequired?: boolean;
  initialValue?: any;
  setValue: SetStateFn;
};

export function PropertyLabel(props: {
  propertyName: string;
  propertyDescription: string;
}) {
  const { propertyName, propertyDescription } = props;
  return propertyDescription != null && propertyDescription.trim() !== "" ? (
    <Group spacing="xs">
      <Text size="md">{propertyName}</Text>

      <Tooltip label={propertyDescription} multiline>
        <ActionIcon>
          <IconHelp size={16} />
        </ActionIcon>
      </Tooltip>
    </Group>
  ) : (
    <Text size="md">{propertyName}</Text>
  );
}

export default function SettingsPropertyRenderer({
  propertyName,
  property,
  isRequired = false,
  initialValue = null,
  setValue,
}: PropertyRendererProps) {
  const propertyType = property.type;
  const defaultValue = property.default;
  const propertyDescription = property.description;
  const [propertyValue, setPropertyValue] = useState(
    initialValue ?? defaultValue
  );

  let propertyControl;

  const setAndPropagateValue = useCallback(
    (newValue: ((prev: any) => void) | any) => {
      const valueToSet =
        typeof newValue === "function" ? newValue(propertyValue) : newValue;

      if (propertyName != null && propertyName.trim() !== "") {
        setValue((prevValue: any) => ({
          ...(prevValue && typeof prevValue === "object" ? prevValue : {}),
          [propertyName]: valueToSet,
        }));
      } else {
        setValue(valueToSet);
      }

      setPropertyValue(valueToSet);
    },
    [propertyName, propertyValue, setValue]
  );

  // Used in the case the property is an array
  // TODO: Should initialize with values from settings if available
  const [itemControls, setItemControls] = useState<JSX.Element[]>([]);
  const itemValues = useRef(new Map<string, any>());

  const removeItemFromList = useCallback(
    async (key: string) => {
      setItemControls((prevItemControls) =>
        prevItemControls.filter((item) => item.key !== key)
      );

      itemValues.current.delete(key);
      setAndPropagateValue(Array.from(itemValues.current.values()));
    },
    [setAndPropagateValue]
  );

  const addItemToList = useCallback(async () => {
    const key = uniqueId();
    setItemControls((prevItemControls) => [
      ...prevItemControls,
      <Group key={key}>
        <SettingsPropertyRenderer
          propertyName=""
          property={property.items}
          setValue={(newItem) => {
            itemValues.current.set(key, newItem);
            setAndPropagateValue(Array.from(itemValues.current.values()));
          }}
        />
        <ActionIcon onClick={() => removeItemFromList(key)}>
          <IconTrash size={16} />
        </ActionIcon>
      </Group>,
    ]);
  }, [property.items, removeItemFromList, setAndPropagateValue]);

  switch (propertyType) {
    case "string": {
      if (property.enum != null) {
        propertyControl = (
          <Autocomplete
            label={
              <PropertyLabel
                propertyName={propertyName}
                propertyDescription={propertyDescription}
              />
            }
            filter={(value: string, item: AutocompleteItem) => {
              const label: string = item.value.toLocaleLowerCase();
              const val = value.toLocaleLowerCase().trim();

              // If selected value matches enum exactly (selected case), show all options
              if (
                property.enum &&
                property.enum.some((v: string) => v === val)
              ) {
                return true;
              }

              // Include item if typed value is a substring
              return label.includes(val);
            }}
            required={isRequired}
            placeholder={propertyValue ?? "select"}
            data={property.enum}
            value={propertyValue ?? ""}
            onChange={setAndPropagateValue}
          />
        );
      } else {
        propertyControl = (
          <TextInput
            label={
              <PropertyLabel
                propertyName={propertyName}
                propertyDescription={propertyDescription}
              />
            }
            placeholder={propertyValue}
            required={isRequired}
            withAsterisk={isRequired}
            radius="md"
            value={propertyValue ?? ""}
            onChange={(event) =>
              setAndPropagateValue(event.currentTarget.value)
            }
          />
        );
      }
      break;
    }
    case "text": {
      propertyControl = (
        <Textarea
          label={
            <PropertyLabel
              propertyName={propertyName}
              propertyDescription={propertyDescription}
            />
          }
          placeholder={propertyValue}
          required={isRequired}
          withAsterisk={isRequired}
          radius="md"
          value={propertyValue ?? ""}
          onChange={(event) => setAndPropagateValue(event.currentTarget.value)}
          autosize
        />
      );
      break;
    }
    case "number": {
      if (property.minimum != null && property.maximum != null) {
        propertyControl = (
          <Stack>
            <PropertyLabel
              propertyName={propertyName}
              propertyDescription={propertyDescription}
            />
            <Slider
              defaultValue={propertyValue ?? property.minimum}
              min={property.minimum}
              max={property.maximum}
              label={(value) => value.toFixed(1)}
              step={property.step ?? 0.1}
              styles={{ markLabel: { display: "none" } }}
              value={propertyValue}
              onChange={setAndPropagateValue}
              style={{ padding: "0 0.5em" }}
            />
          </Stack>
        );
      } else {
        propertyControl = (
          <NumberInput
            label={
              <PropertyLabel
                propertyName={propertyName}
                propertyDescription={propertyDescription}
              />
            }
            defaultValue={propertyValue}
            min={property.minimum}
            max={property.maximum}
            step={property.step ?? 0.05}
            precision={property.precision ?? 2}
            required={isRequired}
            withAsterisk={isRequired}
            radius="md"
            value={propertyValue ?? ""}
            onChange={(val) => setAndPropagateValue(val)}
          />
        );
      }
      break;
    }
    case "integer": {
      if (property.minimum != null && property.maximum != null) {
        propertyControl = (
          <Stack>
            <PropertyLabel
              propertyName={propertyName}
              propertyDescription={propertyDescription}
            />
            <Slider
              defaultValue={propertyValue ?? property.minimum}
              min={property.minimum}
              max={property.maximum}
              label={(value) => value.toFixed(0)}
              step={property.step ?? 1}
              styles={{ markLabel: { display: "none" } }}
              value={propertyValue}
              onChange={setAndPropagateValue}
              style={{ padding: "0 0.5em" }}
            />
          </Stack>
        );
      } else {
        propertyControl = (
          <NumberInput
            label={
              <PropertyLabel
                propertyName={propertyName}
                propertyDescription={propertyDescription}
              />
            }
            defaultValue={propertyValue}
            min={property.minimum}
            max={property.maximum}
            step={property.step ?? 1}
            required={isRequired}
            withAsterisk={isRequired}
            radius="md"
            value={propertyValue ?? ""}
            onChange={(val) => setAndPropagateValue(val)}
          />
        );
      }
      break;
    }
    case "boolean": {
      propertyControl = (
        <Checkbox
          label={
            <PropertyLabel
              propertyName={propertyName}
              propertyDescription={propertyDescription}
            />
          }
          checked={propertyValue}
          onChange={(event) =>
            setAndPropagateValue(event.currentTarget.checked)
          }
        />
      );
      break;
    }
    case "array": {
      propertyControl = (
        <>
          <Group align="end">
            <Text size="md">{propertyName}</Text>
            {propertyDescription != null &&
            propertyDescription.trim() !== "" ? (
              <Tooltip label={propertyDescription} multiline>
                <ActionIcon>
                  <IconHelp size={16} />
                </ActionIcon>
              </Tooltip>
            ) : null}
            <ActionIcon onClick={() => addItemToList()}>
              <IconPlus size={16} />
            </ActionIcon>
          </Group>
          <Stack>{itemControls}</Stack>
        </>
      );
      break;
    }
    case "object": {
      const requiredFields = new Set<string>(property.required ?? []);

      const subproperties = property.properties;

      const subpropertyControls = [];

      for (const subpropertyName in subproperties) {
        const isRequired = requiredFields.has(subpropertyName);
        const subproperty = subproperties[subpropertyName];

        if (subproperty.exclude === true) {
          continue;
        }

        subpropertyControls.push(
          <SettingsPropertyRenderer
            isRequired={isRequired}
            property={subproperty}
            propertyName={subpropertyName}
            key={subpropertyName}
            initialValue={initialValue?.[subpropertyName]}
            setValue={setAndPropagateValue}
          />
        );
      }

      if (subpropertyControls.length > 0) {
        propertyControl = (
          <>
            {propertyName != null && propertyName.trim() !== "" ? (
              <Text>{propertyName}</Text>
            ) : (
              <></>
            )}
            <Stack>{subpropertyControls}</Stack>
          </>
        );
      }

      break;
    }
    case "select": {
      if (property.values != null) {
        propertyControl = (
          <Select
            label={
              <PropertyLabel
                propertyName={propertyName}
                propertyDescription={propertyDescription}
              />
            }
            data={property.values}
            value={propertyValue}
            onChange={(val) => {
              setAndPropagateValue(val);
            }}
            defaultValue={property.default}
          ></Select>
        );
      }
    }
    case "union": {
      propertyControl = (
        <Stack>
          <PropertyLabel
            propertyName={propertyName}
            propertyDescription={propertyDescription}
          />
          <UnionPropertyControl
            property={property as UnionProperty}
            isRequired={isRequired}
            propertyName={propertyName}
            initialValue={initialValue}
            setValue={setAndPropagateValue}
            renderProperty={(props) => <SettingsPropertyRenderer {...props} />}
          />
        </Stack>
      );
    }
    default: {
      console.warn(
        `Warning: Unable to render property '${propertyName}' of type '${propertyType}'.`
      );
    }
  }

  // TODO: Support toggling to monaco JSON editor at top level
  return propertyControl ?? <Text>No settings available</Text>;
}
