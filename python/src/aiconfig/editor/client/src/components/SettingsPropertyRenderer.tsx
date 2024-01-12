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
import { useCallback, useMemo, useRef, useState } from "react";
import { uniqueId } from "lodash";
import { IconHelp, IconPlus, IconTrash } from "@tabler/icons-react";
import UnionPropertyControl, {
  UnionProperty,
} from "./property_controls/UnionPropertyControl";
import { JSONObject, JSONValue } from "aiconfig";

export type StateSetFromPrevFn = (prev: JSONValue) => void;
export type SetStateFn = (val: StateSetFromPrevFn | JSONValue) => void;

export type PropertyRendererProps = {
  propertyName: string;
  property: JSONObject;
  isRequired?: boolean;
  initialValue?: JSONValue;
  onUpdateMissingRequiredFields: (
    fieldName: string,
    fieldValue: JSONValue
  ) => void;
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

      <Tooltip label={propertyDescription} multiline maw={400}>
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
  onUpdateMissingRequiredFields,
  setValue,
}: PropertyRendererProps) {
  const propertyType = property.type;
  const defaultValue = property.default;
  const propertyDescription = property.description;
  const [propertyValue, setPropertyValue] = useState(
    initialValue ?? defaultValue
  );

  // Tried to set this under the "object" case to do all required fields at
  // once, but got an error and it failed to initialize with empty model name
  // The warning still shows (see L354) but now the missingRequiredFields
  // state gets properly initialized
  if (isRequired) {
    onUpdateMissingRequiredFields(propertyName, propertyValue);
  }

  let propertyControl;

  const setAndPropagateValue = useCallback(
    (newValue: ((prev: JSONValue) => void) | JSONValue) => {
      const valueToSet =
        typeof newValue === "function" ? newValue(propertyValue) : newValue;

      if (propertyName != null && propertyName.trim() !== "") {
        setValue((prevValue: JSONValue) => ({
          ...(prevValue && typeof prevValue === "object" ? prevValue : {}),
          [propertyName]: valueToSet,
        }));
      } else {
        setValue(valueToSet);
      }

      setPropertyValue(valueToSet);
      if (isRequired) {
        onUpdateMissingRequiredFields(propertyName, valueToSet);
      }
    },
    [propertyName, propertyValue, setValue]
  );

  // Used in the case the property is an array
  // TODO: Should initialize with values from settings if available
  const [itemControls, setItemControls] = useState<JSX.Element[]>([]);
  const itemValues = useRef(new Map<string, JSONValue>());

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
          onUpdateMissingRequiredFields={onUpdateMissingRequiredFields}
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
      // useEffect(() => {
      //   requiredFields.forEach((fieldName) => {
      //     onUpdateMissingRequiredFields(fieldName, propertyValue);
      //   });
      // }, [onUpdateMissingRequiredFields, propertyValue, requiredFields]);
      /* 
Warning: Cannot update a component (`PromptContainer`) while rendering a different component (`SettingsPropertyRenderer`). To locate the bad setState() call inside `SettingsPropertyRenderer`, follow the stack trace as described in https://reactjs.org/link/setstate-in-render
    at SettingsPropertyRenderer (http://localhost:3000/static/js/bundle.js:2603:3)
    at ModelSettingsSchemaRenderer (http://localhost:3000/static/js/bundle.js:5037:3)
    at ErrorBoundary (http://localhost:3000/static/js/bundle.js:98890:5)
    at div
    at http://localhost:3000/static/js/bundle.js:16970:7
    at http://localhost:3000/static/js/bundle.js:19757:87
    at ModelSettingsRenderer (http://localhost:3000/static/js/bundle.js:4900:3)
    at div
    at http://localhost:3000/static/js/bundle.js:16970:7
    at http://localhost:3000/static/js/bundle.js:29355:87
    at div
    at http://localhost:3000/static/js/bundle.js:16970:7
    at Provider (http://localhost:3000/static/js/bundle.js:36683:5)
    at TabsProvider (http://localhost:3000/static/js/bundle.js:29451:3)
    at http://localhost:3000/static/js/bundle.js:29024:87
    at div
    at http://localhost:3000/static/js/bundle.js:16970:7
    at http://localhost:3000/static/js/bundle.js:19356:87
    at div
    at http://localhost:3000/static/js/bundle.js:16970:7
    at http://localhost:3000/static/js/bundle.js:19757:87
    at PromptActionBar (http://localhost:3000/static/js/bundle.js:3810:3)
    at div
    at div
    at http://localhost:3000/static/js/bundle.js:16970:7
    at http://localhost:3000/static/js/bundle.js:19757:87
    at PromptContainer (http://localhost:3000/static/js/bundle.js:4028:3)
    at div
    at http://localhost:3000/static/js/bundle.js:16970:7
    at http://localhost:3000/static/js/bundle.js:19757:87
    at div
    at http://localhost:3000/static/js/bundle.js:16970:7
    at http://localhost:3000/static/js/bundle.js:28574:87
    at div
    at http://localhost:3000/static/js/bundle.js:16970:7
    at http://localhost:3000/static/js/bundle.js:19356:87
    at EditorContainer (http://localhost:3000/static/js/bundle.js:591:13)
    at ThemeProvider (http://localhost:3000/static/js/bundle.js:10359:50)
    at MantineProvider (http://localhost:3000/static/js/bundle.js:34891:3)
    at div
    at Editor (http://localhost:3000/static/js/bundle.js:41:82)


*/

      // useMemo(
      //   () =>
      //   requiredFields.forEach((fieldName) => {
      //     onUpdateMissingRequiredFields(fieldName, propertyValue);
      //   });
      //   [fieldName, onUpdateMissingRequiredFields, propertyValue, requiredFields]
      // );
      // requiredFields.forEach((fieldName) => {
      //   onUpdateMissingRequiredFields(fieldName, propertyValue);
      // });

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
            onUpdateMissingRequiredFields={onUpdateMissingRequiredFields}
            initialValue={
              (initialValue as JSONObject | undefined)?.[subpropertyName]
            }
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
      break;
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
            onUpdateMissingRequiredFields={onUpdateMissingRequiredFields}
            setValue={setAndPropagateValue}
            renderProperty={(props) => <SettingsPropertyRenderer {...props} />}
          />
        </Stack>
      );
      break;
    }
    default: {
      console.warn(
        `Warning: Unable to render property '${propertyName}' of type '${propertyType}'.`
      );
    }
  }

  // TODO: Support toggling to monaco JSON editor at top level
  return propertyControl ?? null;
}
