// Local state to maintain all the possible properties from a schema, as well as 'dirty' state to track
// which properties have been changed. This is used to determine which properties to propagate to the config.
// Otherwise, the config would be bloated with unnecessary settings just by loading it in the editor.

import {
  ModelSettingsSchema,
  PromptMetadataSchema,
} from "@/src/utils/promptUtils";
import { useCallback, useRef, useState } from "react";

export function useSchemaState(
  schema: ModelSettingsSchema | PromptMetadataSchema,
  initialData?: Record<string, unknown>
) {
  const [schemaState, setSchemaState] = useState<
    Record<string, { value: unknown; dirty: boolean }>
  >(
    Object.keys(schema.properties).reduce((acc, key) => {
      acc[key] = { value: initialData?.[key] ?? null, dirty: false };
      return acc;
    }, {} as Record<string, { value: unknown; dirty: boolean }>)
  );

  const stateRef = useRef(schemaState);
  stateRef.current = schemaState;

  // Get the state of the schema as a concrete object, only including properties that have been changed
  const getConcreteState = useCallback(
    () =>
      Object.keys(stateRef.current).reduce((acc, key) => {
        if (stateRef.current[key].dirty) {
          acc[key] = stateRef.current[key].value;
        }
        return acc;
      }, {} as Record<string, unknown>),
    []
  );

  const setSchemaValue = useCallback((key: string, value: unknown) => {
    setSchemaState((currentState) => ({
      ...currentState,
      [key]: { value, dirty: true },
    }));
  }, []);

  return { schemaState, getConcreteState, setSchemaValue };
}
