import { useCallback, useEffect, useState } from "react";
import { showNotification } from "@mantine/notifications";

export default function useLoadModels(
  modelSearch: string,
  getModels?: (search: string) => Promise<string[]>
) {
  const [models, setModels] = useState<string[]>([]);

  const loadModels = useCallback(
    async (modelSearch: string) => {
      if (!getModels) {
        return;
      }
      try {
        const models = await getModels(modelSearch);
        setModels(models);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : null;
        showNotification({
          title: "Error loading models",
          message,
          color: "red",
        });
      }
    },
    [getModels]
  );

  useEffect(() => {
    loadModels(modelSearch);
  }, [loadModels, modelSearch]);

  return models;
}
