import EditorContainer from "./components/EditorContainer";
import { ClientAIConfig } from "./shared/types";
import { Flex, Loader } from "@mantine/core";
import { AIConfig } from "aiconfig";
import { useCallback, useEffect, useState } from "react";
import { ufetch } from "ufetch";
import { ROUTE_TABLE } from "./utils/api";

export default function Editor() {
  const [aiconfig, setAiConfig] = useState<ClientAIConfig | undefined>();

  const loadConfig = useCallback(async () => {
    const res = await ufetch.post(ROUTE_TABLE.LOAD, {
      path: "cli/aiconfig-editor/travel.aiconfig.json",
    });

    setAiConfig(res.aiconfig);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

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
        <EditorContainer aiconfig={aiconfig} onSave={onSave} />
      )}
    </div>
  );
}
