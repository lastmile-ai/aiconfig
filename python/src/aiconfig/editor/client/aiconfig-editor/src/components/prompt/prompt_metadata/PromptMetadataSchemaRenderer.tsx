import SettingsPropertyRenderer, {
  SetStateFn,
} from "../../SettingsPropertyRenderer";
import { GenericPropertiesSchema } from "../../../utils/promptUtils";
import { JSONObject, JSONValue } from "aiconfig";
import { memo, useMemo } from "react";
import { debounce } from "lodash";
import { DEBOUNCE_MS } from "../../../utils/constants";

type Props = {
  schema: GenericPropertiesSchema;
  metadata?: JSONObject;
  onUpdatePromptMetadata: (metadata: Record<string, unknown>) => void;
};

export default memo(function ModelSettingsSchemaRenderer({
  schema,
  metadata,
  onUpdatePromptMetadata,
}: Props) {
  const debouncedConfigUpdate = useMemo(
    () =>
      debounce(
        (newMetadata: JSONObject) => onUpdatePromptMetadata(newMetadata),
        DEBOUNCE_MS
      ),
    [onUpdatePromptMetadata]
  );

  const setValue: SetStateFn = (
    newValue: ((prev: JSONValue) => void) | JSONValue
  ) => {
    const newMetadata =
      typeof newValue === "function" ? newValue(metadata) : newValue;
    debouncedConfigUpdate(newMetadata);
  };

  return (
    <SettingsPropertyRenderer
      propertyName={""}
      property={schema}
      isRequired={false}
      initialValue={metadata}
      setValue={setValue}
    />
  );
});
