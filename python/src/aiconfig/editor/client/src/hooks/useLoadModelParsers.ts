import { useCallback, useEffect, useState } from "react";
import { showNotification } from "@mantine/notifications";

export default function useLoadModelParsers(
  parserSearch: string,
  getModelParsers: (search?: string) => Promise<string[]>
) {
  const [parsers, setParsers] = useState<string[]>([]);

  const loadParsers = useCallback(
    async (parserSearch: string) => {
      try {
        const parsers = await getModelParsers(parserSearch);
        setParsers(parsers);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : null;
        showNotification({
          title: "Error loading model parsers",
          message,
          color: "red",
        });
      }
    },
    [getModelParsers]
  );

  useEffect(() => {
    loadParsers(parserSearch);
  }, [loadParsers, parserSearch]);

  return parsers;
}
