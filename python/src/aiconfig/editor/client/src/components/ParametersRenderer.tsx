import {
  Group,
  Text,
  TextInput,
  Textarea,
  ActionIcon,
  Stack,
  useMantineTheme,
  Tooltip,
} from "@mantine/core";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import { debounce, uniqueId } from "lodash";
import { useState, useCallback, memo, useMemo } from "react";

interface JSONArray extends Array<JSONValue> {}

interface JSONObject {
  [x: string]: JSONValue;
}

type JSONValue = string | number | boolean | JSONObject | JSONArray | unknown;

type Parameter = { parameterName: string; parameterValue: JSONValue };

/**
 * Parameter name must start with a letter (a-z, A-Z) or an underscore (_). The rest of the
 * name can contain letters, digits (0-9), underscores, and dollar signs ($).
 */
export function isValidParameterName(name: string): boolean {
  const validNamePattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  return validNamePattern.test(name);
}

const ParameterInput = memo(function ParameterInput(props: {
  onUpdateParameter: (data: {
    promptName?: string;
    parameterName: string;
    oldParameterName?: string;
    parameterValue?: string;
  }) => void;
  initialItemValue?: Parameter;
  removeParameter: (parameterName?: string) => Promise<void>;
}) {
  const { initialItemValue, removeParameter, onUpdateParameter } = props;
  // TODO: saqadri - update this once we have a readonly mode
  const { isReadonly } = { isReadonly: false };

  const [parameterName, setParameterName] = useState(
    initialItemValue?.parameterName ?? ""
  );
  const [lastParameterName, setLastParameterName] =
    useState<string>(parameterName);

  const parameterValue = initialItemValue?.parameterValue;

  const [parameterValueString, setParameterValueString] = useState(
    typeof parameterValue === "string"
      ? parameterValue
      : JSON.stringify(parameterValue)
  );

  const debouncedCellParameterUpdate = useMemo(
    () =>
      debounce((newParameterName: string, newParameterValue: string) => {
        if (!isValidParameterName(newParameterName)) {
          return;
        }

        onUpdateParameter({
          oldParameterName: lastParameterName,
          parameterName: newParameterName,
          parameterValue: newParameterValue,
        });

        setLastParameterName(newParameterName);
      }, 250),
    [lastParameterName, onUpdateParameter]
  );

  const theme = useMantineTheme();
  const border =
    theme.colorScheme === "dark" ? "1px solid #2C2E33" : "1px solid #e9ecef";

  return (
    <Group>
      <Stack p="xs" spacing="xs" style={{ flexGrow: 1, borderBottom: border }}>
        <TextInput
          placeholder="Enter parameter name"
          disabled={isReadonly}
          error={
            parameterName && !isValidParameterName(parameterName)
              ? "Name must contain only letters, numbers, and underscores"
              : null
          }
          radius="md"
          size="xs"
          value={parameterName}
          onChange={(event) => {
            setParameterName(event.target.value);
            if (event.target.value) {
              debouncedCellParameterUpdate(
                event.target.value,
                parameterValueString
              );
            }
          }}
        />
        <Textarea
          placeholder="Enter parameter value"
          disabled={isReadonly}
          radius="md"
          value={parameterValueString}
          autosize
          size="xs"
          maxRows={5}
          onChange={(event) => {
            setParameterValueString(event.target.value);
            debouncedCellParameterUpdate(parameterName, event.target.value);
          }}
        />
      </Stack>
      <ActionIcon
        onClick={() => removeParameter(parameterName)}
        style={{ marginTop: -50 }}
        disabled={isReadonly}
      >
        <IconTrash size={16} color={isReadonly ? "grey" : "red"} />
      </ActionIcon>
    </Group>
  );
});

export type ParametersArray = {
  parameterName: string;
  parameterValue: JSONValue;
  key: string;
}[];

export function ParametersRenderer(props: {
  initialValue?: JSONObject;
  onUpdateParameters: (data: {
    promptName?: string;
    newParameters: ParametersArray;
  }) => void;
  customDescription?: React.ReactNode;
  maxHeight?: string | number;
}) {
  const { initialValue, onUpdateParameters } = props;
  // TODO: saqadri - update this when we have a readonly mode
  const { isReadonly } = { isReadonly: false }; //useContext(WorkbookContext);

  const [parameters, setParameters] = useState<ParametersArray>(
    initialValue && Object.keys(initialValue).length > 0
      ? Object.keys(initialValue).map((parameterName) => {
          return {
            key: parameterName,
            parameterName,
            parameterValue: initialValue[parameterName],
          };
        })
      : [
          {
            key: uniqueId(),
            parameterName: "",
            parameterValue: "",
          },
        ]
  );

  const removeParameter = useCallback(
    async (key: string, parameterName?: string) => {
      setParameters((prev) => {
        const newParameters = prev.filter((item) => item.key !== key);
        onUpdateParameters({ newParameters });
        return newParameters;
      });
    },
    [setParameters, onUpdateParameters]
  );

  const addParameter = useCallback(async () => {
    setParameters((prev) => {
      const newParameters = [
        ...prev,
        {
          key: uniqueId(),
          parameterName: "",
          parameterValue: "",
        },
      ];
      onUpdateParameters({ newParameters });
      return newParameters;
    });
  }, [onUpdateParameters]);

  const theme = useMantineTheme();

  return (
    <div
      style={{
        maxHeight: props.maxHeight ?? "300px",
        overflow: "auto",
        width: "100%",
      }}
    >
      {props.customDescription ?? (
        <Text
          color="dimmed"
          size="sm"
          p="xs"
          style={{ display: "block", margin: "0 auto", textAlign: "right" }}
        >
          Use parameters in your prompt or system prompt with {"{{parameter}}"}
        </Text>
      )}
      <Stack>
        {parameters.map((parameter, i) => {
          return (
            <ParameterInput
              onUpdateParameter={({ parameterName, parameterValue }) => {
                setParameters((prev) => {
                  const newParameters = [...prev];
                  const currentElement = newParameters[i];
                  currentElement.parameterName = parameterName;
                  currentElement.parameterValue = parameterValue ?? "";

                  onUpdateParameters({ newParameters });

                  return newParameters;
                });
              }}
              removeParameter={(parameterName) =>
                removeParameter(parameter.key, parameterName)
              }
              initialItemValue={{
                parameterName: parameter.parameterName,
                parameterValue: parameter.parameterValue,
              }}
              key={parameter.key}
            />
          );
        })}
      </Stack>
      {isReadonly ? null : (
        <Tooltip label="Add parameter">
          <ActionIcon onClick={addParameter}>
            <IconPlus size={16} />
          </ActionIcon>
        </Tooltip>
      )}
    </div>
  );
}
