import SettingsPropertyRenderer from "../../SettingsPropertyRenderer";
import { GenericPropertiesSchema } from "../../../utils/promptUtils";
import { JSONObject } from "aiconfig";
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
