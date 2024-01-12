import EditorContainer, {
  AIConfigCallbacks,
} from "./components/EditorContainer";
import { Flex, Loader, MantineProvider } from "@mantine/core";
import { AIConfig, ModelMetadata, Prompt } from "aiconfig";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ufetch } from "ufetch";
import { ROUTE_TABLE } from "./utils/api";

export default function Editor() {
  const [aiconfig, setAiConfig] = useState<AIConfig | undefined>({
    name: "NYC Trip Planner",
    description: "Intrepid explorer with ChatGPT and AIConfig",
    schema_version: "latest",
    metadata: {
      models: {
        "gpt-3.5-turbo": {
          model: "gpt-3.5-turbo",
          top_p: 1,
          temperature: 1,
        },
        "gpt-4": {
          model: "gpt-4",
          max_tokens: 3000,
          system_prompt:
            "You are an expert travel coordinator with exquisite taste.",
        },
      },
      default_model: "gpt-3.5-turbo",
    },
    prompts: [
      {
        name: "get_activities",
        input: "Tell me 10 fun attractions to do in NYC.",
      },
      {
        name: "gen_itinerary",
        input:
          "Generate an itinerary ordered by {{order_by}} for these activities: {{get_activities.output}}.",
        metadata: {
          model: "gpt-4",
          parameters: {
            order_by: "geographic location",
          },
        },
      },
    ],
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
