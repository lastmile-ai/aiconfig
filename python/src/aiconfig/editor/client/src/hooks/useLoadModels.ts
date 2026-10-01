import { useCallback, useContext, useEffect, useRef, useState } from "react";
import NotificationContext from "../components/notifications/NotificationContext";
import AIConfigContext from "../contexts/AIConfigContext";

export default function useLoadModels(
  getModels?: (search?: string) => Promise<string[]>,
  modelSearch?: string
) {
  const [models, setModels] = useState<string[]>([]);
  const latestRequest = useRef(0);
  const { showNotification } = useContext(NotificationContext);
  const { readOnly } = useContext(AIConfigContext);

  const loadModels = useCallback(
    async (modelSearch?: string) => {
      const request = ++latestRequest.current;
      if (!getModels || readOnly) {
        return;
      }
      try {
        const models = await getModels(modelSearch);
        if (request === latestRequest.current) {
          setModels(models);
        }
      } catch (err: unknown) {
        if (request !== latestRequest.current) {
          return;
        }
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
    return () => {
      latestRequest.current += 1;
    };
  }, [loadModels, modelSearch]);

  return models;
}
