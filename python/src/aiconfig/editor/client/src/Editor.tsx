import EditorContainer, {
  AIConfigCallbacks,
} from "./components/EditorContainer";
import { ClientAIConfig } from "./shared/types";
import { Flex, Loader, MantineProvider } from "@mantine/core";
import { AIConfig, Prompt } from "aiconfig";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ufetch } from "ufetch";
import { ROUTE_TABLE } from "./utils/api";

export default function Editor() {
  const [aiconfig, setAiConfig] = useState<ClientAIConfig | undefined>();

  const loadConfig = useCallback(async () => {
    const res = await ufetch.post(ROUTE_TABLE.LOAD, {});

    setAiConfig(res.aiconfig);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const save = useCallback(async (aiconfig: AIConfig) => {
    const res = await ufetch.post(ROUTE_TABLE.SAVE, {
      // path: file path,
      aiconfig,
    });
    return res;
  }, []);

  const getModels = useCallback(async (search: string) => {
    // For now, rely on caching and handle client-side search filtering
    // We will use server-side search filtering for Gradio
    const res = await ufetch.get(ROUTE_TABLE.LIST_MODELS);
    const models = res.data;
    if (search && search.length > 0) {
      return models.filter((model: string) => model.indexOf(search) >= 0);
    }
    return models;
  }, []);

  const addPrompt = useCallback(
    async (promptName: string, promptData: Prompt, index: number) => {
      return await ufetch.post(ROUTE_TABLE.ADD_PROMPT, {
        prompt_name: promptName,
        prompt_data: promptData,
        index,
      });
    },
    []
  );

  const runPrompt = useCallback(async (promptName: string) => {
    const res = await ufetch.post("http://localhost:8080/api/test_streaming", {
      prompt_name: promptName,
    });
    console.log("stream res: ", res);
    return res;
  }, []);

  const callbacks: AIConfigCallbacks = useMemo(
    () => ({
      addPrompt,
      getModels,
      runPrompt,
      save,
    }),
    [save, getModels, addPrompt, runPrompt]
  );

  return (
    <div>
      <MantineProvider withGlobalStyles withNormalizeCSS>
        {!aiconfig ? (
          <Flex justify="center" mt="xl">
            <Loader size="xl" />
          </Flex>
        ) : (
          <EditorContainer aiconfig={aiconfig} callbacks={callbacks} />
        )}
      </MantineProvider>
    </div>
  );
}
