import SettingsPropertyRenderer from "@/src/components/SettingsPropertyRenderer";
import { useSchemaState } from "@/src/hooks/useSchemaState";
import { ModelSettingsSchema } from "@/src/utils/promptUtils";
import { Flex } from "@mantine/core";
import { JSONObject } from "aiconfig/dist/common";
import { memo } from "react";

type Props = {
  schema: ModelSettingsSchema;
  settings?: JSONObject;
};

export default memo(function ModelSettingsSchemaRenderer({
  schema,
  settings,
}: Props) {
  const { schemaState } = useSchemaState(schema, settings);

  return (
    <Flex direction="column">
      {Object.entries(schema.properties).map(([key, value]) => (
        <SettingsPropertyRenderer
          propertyName={key}
          key={key}
          property={value}
          isRequired={schema.required?.includes(key)}
          initialValue={schemaState[key].value}
        />
      ))}
    </Flex>
  );
});
