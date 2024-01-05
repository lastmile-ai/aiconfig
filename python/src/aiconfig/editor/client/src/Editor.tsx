import EditorContainer, {
  AIConfigCallbacks,
} from "./components/EditorContainer";
import { Flex, Loader, MantineProvider } from "@mantine/core";
import { AIConfig, InferenceSettings, JSONObject, Prompt } from "aiconfig";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ufetch } from "ufetch";
import { ROUTE_TABLE } from "./utils/api";

export default function Editor() {
  const [aiconfig, setAiConfig] = useState<AIConfig | undefined>();

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
      const lowerCaseSearch = search.toLowerCase();
      return models.filter(
        (model: string) =>
          model.toLocaleLowerCase().indexOf(lowerCaseSearch) >= 0
      );
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
    async (value: {
      modelName?: string;
      settings?: InferenceSettings;
      promptName?: string;
    }) => {
      return await ufetch.post(ROUTE_TABLE.UPDATE_MODEL, {
        model_name: value.modelName,
        settings: value.settings,
        prompt_name: value.promptName,
      });
    },
    []
  );

  const setConfigName = useCallback(async (name: string) => {
    return await ufetch.post(ROUTE_TABLE.SET_NAME, {
      name,
    });
  }, []);

  const setConfigDescription = useCallback(async (description: string) => {
    return await ufetch.post(ROUTE_TABLE.SET_DESCRIPTION, {
      description,
    });
  }, []);

  const setParameters = useCallback(
    async (parameters: JSONObject, promptName?: string) => {
      return await ufetch.post(ROUTE_TABLE.SET_PARAMETERS, {
        parameters,
        prompt_name: promptName,
      });
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
      setConfigDescription,
      setConfigName,
      setParameters,
      updateModel,
      updatePrompt,
    }),
    [
      addPrompt,
      deletePrompt,
      getModels,
      runPrompt,
      save,
      setConfigDescription,
      setConfigName,
      setParameters,
      updateModel,
      updatePrompt,
    ]
  );

  return (
    <div>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          globalStyles: (theme) => ({
            ".add-prompt-button": {
              backgroundColor: "red",
            },
            ".add-prompt-row": {
              borderRadius: "4px",
              display: "inline-block",
              bottom: -24,
              left: -40,
              "&:hover": {
                backgroundColor:
                  theme.colorScheme === "light"
                    ? theme.colors.gray[1]
                    : "rgba(255, 255, 255, 0.1)",
              },
              [theme.fn.smallerThan("sm")]: {
                marginLeft: "0",
                display: "block",
                position: "static",
                bottom: -10,
                left: 0,
                height: 28,
                margin: "10px 0",
              },
            },
          }),
        }}
      >
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
