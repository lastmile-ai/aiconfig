import EditorContainer, {
  AIConfigCallbacks,
} from "./components/EditorContainer";
import { Flex, Loader, MantineProvider } from "@mantine/core";
import { AIConfig, ModelMetadata, Prompt } from "aiconfig";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ufetch } from "ufetch";
import { ROUTE_TABLE } from "./utils/api";
import WebviewContext from "./WebviewContext";

export default function Editor() {
  const [aiconfig, setAIConfig] = useState<AIConfig | undefined>();

  const { vscode } = useContext(WebviewContext);

  const updateContent = useCallback(
    async (text: string) => {
      // TODO: saqadri - this won't work for YAML -- the handling of the text needs to include the logic from AIConfig.load
      const updatedConfig = text != null ? JSON.parse(text) : {};
      console.log("updatedConfig=", JSON.stringify(updatedConfig));
      setAIConfig(updatedConfig);

      // Then persist state information.
      // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
      vscode?.setState({ text });

      // TODO: saqadri - as soon as content is updated, we have to call /load endpoint for the server to have the latest content as well
      // However, instead of loading from FS, the /load endpoint should load from the data passed to it here.
    },
    [vscode]
  );

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    console.log("onMessage, event=", JSON.stringify(event));
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "update": {
        console.log("onMessage, message=", JSON.stringify(message));
        const text = message.text;

        // Update our webview's content
        updateContent(text);
        return;
      }
    }
  });

  // const loadConfig = useCallback(async () => {
  //   const res = await ufetch.post(ROUTE_TABLE.LOAD, {});

  //   setAiConfig(res.aiconfig);
  // }, []);

  // useEffect(() => {
  //   loadConfig();
  // }, [loadConfig]);

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

  const deletePrompt = useCallback(async (promptName: string) => {
    return await ufetch.post(ROUTE_TABLE.DELETE_PROMPT, {
      prompt_name: promptName,
    });
  }, []);

  const runPrompt = useCallback(async (promptName: string) => {
    return await ufetch.post(ROUTE_TABLE.RUN_PROMPT, {
      prompt_name: promptName,
    });
  }, []);

  const updatePrompt = useCallback(
    async (promptName: string, promptData: Prompt) => {
      return await ufetch.post(ROUTE_TABLE.UPDATE_PROMPT, {
        prompt_name: promptName,
        prompt_data: promptData,
      });
    },
    []
  );

  const updateModel = useCallback(
    async (_promptName?: string, _modelData?: string | ModelMetadata) => {
      // return await ufetch.post(ROUTE_TABLE.UPDATE_MODEL,
      //   prompt_name: promptName,
      //   model_data: modelData,
      // });
    },
    []
  );

  const callbacks: AIConfigCallbacks = useMemo(
    () => ({
      addPrompt,
      deletePrompt,
      getModels,
      runPrompt,
      save,
      updateModel,
      updatePrompt,
    }),
    [
      addPrompt,
      deletePrompt,
      getModels,
      runPrompt,
      save,
      updateModel,
      updatePrompt,
    ]
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
