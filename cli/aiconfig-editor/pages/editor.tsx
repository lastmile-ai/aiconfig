import EditorContainer from "@/src/components/EditorContainer";
import { ClientAIConfig } from "@/src/shared/types";
import { Flex, Loader } from "@mantine/core";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { ufetch } from "ufetch";

export default function Editor() {
  // Use router to get the path, load the file using aiconfig.load, make it editable & use save to save it regularly
  // TODO: Settings, other things to edit, allowing plugins in editor (eg for custom model parsers in python or JS)
  const router = useRouter();
  const [aiconfig, setAiConfig] = useState<ClientAIConfig | undefined>();

  const loadConfig = useCallback(async () => {
    if (!router.query.path) {
      return;
    }

    const res = await ufetch.post(`/api/aiconfig/load`, {
      path: router.query.path,
    });

    setAiConfig(res.aiconfig);
  }, [router]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const onBackNavigation = useCallback(() => {
    if (!router.query.path) {
      return;
    } else {
      router.back();
    }
  }, [router]);

  const onSave = useCallback(
    async (aiconfig: ClientAIConfig) => {
      const res = await ufetch.post(`/api/aiconfig/save`, {
        path: router.query.path,
        aiconfig,
      });
      return res;
    },
    [router]
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
          onBackNavigation={onBackNavigation}
          onSave={onSave}
        />
      )}
    </div>
  );
}
