import SettingsPropertyRenderer, {
  SetStateFn,
} from "../../SettingsPropertyRenderer";
import { GenericPropertiesSchema } from "../../../utils/promptUtils";
import { JSONObject, JSONValue } from "aiconfig";
import { memo, useMemo } from "react";
import { debounce } from "lodash";

type Props = {
  schema: GenericPropertiesSchema;
  settings?: JSONObject;
  onUpdateMissingRequiredFields: (
    fieldName: string,
    fieldValue: JSONValue
  ) => void;
  onUpdateModelSettings: (settings: Record<string, unknown>) => void;
};

export default memo(function ModelSettingsSchemaRenderer({
  schema,
  settings,
  onUpdateMissingRequiredFields,
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

  const setValue: SetStateFn = (
    newValue: ((prev: JSONValue) => void) | JSONValue
  ) => {
    const newSettings =
      typeof newValue === "function" ? newValue(settings) : newValue;
    debouncedConfigUpdate(newSettings);
  };

  return (
    <SettingsPropertyRenderer
      propertyName={""}
      property={schema}
      isRequired={false}
      initialValue={settings}
      onUpdateMissingRequiredFields={onUpdateMissingRequiredFields}
      setValue={setValue}
    />
  );
});
