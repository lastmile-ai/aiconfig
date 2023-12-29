import { useCallback, useEffect, useState } from "react";
import { showNotification } from "@mantine/notifications";

export default function useLoadModels(
  modelSearch: string,
  getModels: (search: string) => Promise<string[]>
) {
  const [models, setModels] = useState<string[]>([]);

  const loadModels = useCallback(
    async (modelSearch: string) => {
      try {
        const models = await getModels(modelSearch);
        setModels(models);
      } catch (err: any) {
        showNotification({
          title: "Error loading models",
          message: err?.message,
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
