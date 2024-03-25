import { useCallback, useContext, useEffect, useState } from "react";
import NotificationContext from "../components/notifications/NotificationContext";
import AIConfigContext from "../contexts/AIConfigContext";

export default function useLoadModels(
  getModels?: (search?: string) => Promise<string[]>,
  modelSearch?: string
) {
  const [models, setModels] = useState<string[]>([]);
  const { showNotification } = useContext(NotificationContext);
  const { readOnly } = useContext(AIConfigContext);

  const loadModels = useCallback(
    async (modelSearch?: string) => {
      if (!getModels || readOnly) {
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
    [getModels, readOnly, showNotification]
  );

  useEffect(() => {
    loadModels(modelSearch);
  }, [loadModels, modelSearch]);

  return models;
}
