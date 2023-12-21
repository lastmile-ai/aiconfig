import EditorContainer from "./components/EditorContainer";
import { ClientAIConfig } from "./shared/types";
import { Flex, Loader } from "@mantine/core";
import { AIConfig } from "aiconfig";
import { useCallback, useEffect, useState } from "react";
import { ufetch } from "ufetch";

export default function Editor() {
  const [aiconfig, setAiConfig] = useState<ClientAIConfig | undefined>();

  const loadConfig = useCallback(async () => {
    const res = await ufetch.post(`/api/load`, {});

    setAiConfig(res.aiconfig);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const onBackNavigation = useCallback(() => {
    //  TODO: Handle file back navigation
  }, []);

  const onSave = useCallback(async (aiconfig: AIConfig) => {
    const res = await ufetch.post(`/api/aiconfig/save`, {
      // path: file path,
      aiconfig,
    });
    return res;
  }, []);

  return (
    <div>
      {!aiconfig ? (
        <Flex justify="center" mt="xl">
          <Loader size="xl" />
        </Flex>
      ) : (
        <EditorContainer
          aiconfig={aiconfig}
          onBackNavigation={onBackNavigation}
          onSave={onSave}
        />
      )}
    </div>
  );
}
