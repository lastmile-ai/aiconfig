import { useCallback, useContext, useEffect, useState } from "react";
import NotificationContext from "../components/notifications/NotificationContext";

export default function useLoadModels(
  modelSearch: string,
  getModels?: (search: string) => Promise<string[]>
) {
  const [models, setModels] = useState<string[]>([]);
  const { showNotification } = useContext(NotificationContext);

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
          type: "error",
        });
      }
    },
    [getModels, showNotification]
  );

  useEffect(() => {
    loadModels(modelSearch);
  }, [loadModels, modelSearch]);

  return models;
}
