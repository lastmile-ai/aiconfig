import { useCallback, useEffect, useState } from "react";
import { showNotification } from "@mantine/notifications";
import { Model } from "../shared/types";

export default function useLoadModels(
  modelSearch: string,
  getModels: (search: string) => Promise<Model[]>
) {
  const [models, setModels] = useState<Model[]>([]);

  const loadModels = useCallback(
    async (modelSearch: string) => {
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
