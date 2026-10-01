import SettingsPropertyRenderer, {
  SetStateFn,
} from "../../SettingsPropertyRenderer";
import { GenericPropertiesSchema } from "../../../utils/promptUtils";
import { JSONObject, JSONValue } from "aiconfig";
import { memo, useEffect, useMemo, useRef } from "react";
import { debounce } from "lodash";
import { DEBOUNCE_MS } from "../../../utils/constants";

type Props = {
  schema: GenericPropertiesSchema;
  metadata?: JSONObject;
  onUpdatePromptMetadata: (metadata: Record<string, unknown>) => void;
};

export function applyMetadataUpdate(
  currentMetadata: JSONObject | undefined,
  update: ((previous: JSONValue) => void) | JSONValue
): JSONObject {
  return (
    typeof update === "function" ? update(currentMetadata ?? {}) : update
  ) as JSONObject;
}

export default memo(function ModelSettingsSchemaRenderer({
  schema,
  metadata,
  onUpdatePromptMetadata,
}: Props) {
  const latestMetadata = useRef(metadata);
  useEffect(() => {
    latestMetadata.current = metadata;
  }, [metadata]);

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
    const newMetadata = applyMetadataUpdate(latestMetadata.current, newValue);
    latestMetadata.current = newMetadata;
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
