import SettingsPropertyRenderer from "@/src/components/SettingsPropertyRenderer";
import { useSchemaState } from "@/src/hooks/useSchemaState";
import { GenericPropertiesSchema } from "@/src/utils/promptUtils";
import { Flex } from "@mantine/core";
import { JSONObject } from "aiconfig/dist/common";
import { memo, useCallback, useMemo } from "react";
import { debounce } from "lodash";

type Props = {
  schema: GenericPropertiesSchema;
  settings?: JSONObject;
  onUpdateModelSettings: (settings: Record<string, unknown>) => void;
};

export default memo(function ModelSettingsSchemaRenderer({
  schema,
  settings,
  onUpdateModelSettings,
}: Props) {
  const debouncedConfigUpdate = useMemo(
    () =>
      debounce(
        (newSettings: JSONObject) => onUpdateModelSettings(newSettings),
        250
      ),
    [onUpdateModelSettings]
  );

  const setValue = useCallback(
    (newSettings: JSONObject) => debouncedConfigUpdate(newSettings),
    [debouncedConfigUpdate]
  );

  return (
    <SettingsPropertyRenderer
      propertyName={""}
      property={schema}
      isRequired={false}
      initialValue={settings}
      setValue={setValue}
    />
  );
});
