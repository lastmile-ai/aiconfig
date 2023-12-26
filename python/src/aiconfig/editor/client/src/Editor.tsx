import EditorContainer from "./components/EditorContainer";
import { ClientAIConfig } from "./shared/types";
import { Flex, Loader } from "@mantine/core";
import { AIConfig, Prompt } from "aiconfig";
import { useCallback, useEffect, useState } from "react";
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

  const onSave = useCallback(async (aiconfig: AIConfig) => {
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
    async (promptName: string, promptData: Prompt) => {
      return await ufetch.post(ROUTE_TABLE.ADD_PROMPT, {
        prompt_name: promptName,
        prompt_data: promptData,
      });
    },
    []
  );

  return (
    <div>
      {!aiconfig ? (
        <Flex justify="center" mt="xl">
          <Loader size="xl" />
        </Flex>
      ) : (
        <EditorContainer
          aiconfig={aiconfig}
          onSave={onSave}
          getModels={getModels}
          addPrompt={addPrompt}
        />
      )}
    </div>
  );
}
