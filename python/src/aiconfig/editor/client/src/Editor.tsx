import EditorContainer, {
  AIConfigCallbacks,
} from "./components/EditorContainer";
import { Flex, Loader, MantineProvider, Image } from "@mantine/core";
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
    <div className="editorBackground">
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          // colorScheme: "dark",

          headings: {
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, Arial, sans-serif",
            sizes: {
              h1: { fontSize: "2rem" },
            },
          },

          defaultGradient: {
            from: "#E88949",
            to: "#E85921",
            deg: 90,
          },

          //gradio light theme
          globalStyles: (theme) => ({
            ".editorBackground": {
              background: theme.colorScheme === "light" ? "white" : "#0b0f19",
              margin: "0 auto",
              minHeight: "100vh",
            },
            ".monoFont": {
              fontFamily:
                "sf mono, ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            },
            ".ghost": {
              input: {
                maxHeight: "16px",
                fontFamily:
                  "sf mono, ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                borderRadius: "8px",
                margin: "8px 0px 0px 0px",
                backgroundColor:
                  theme.colorScheme === "light" ? "white" : "#384152",
                boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
                ":focus": {
                  outline: "solid 1px #E85921 !important",
                  outlineOffset: "-1px",
                },
              },
            },
            ".cellStyle": {
              border: "1px solid",
              borderColor:
                theme.colorScheme === "light" ? "#E5E7EB" : "#384152",
              background: theme.colorScheme === "light" ? "white" : "#1f2938",
              flex: 1,
              borderTopRightRadius: "0px",
              borderBottomRightRadius: "0px",
              borderTopLeftRadius: "8px",
              borderBottomLeftRadius: "8px",
              ":hover": {
                background:
                  theme.colorScheme === "light"
                    ? "rgba(249, 250, 251, 0.5) !important"
                    : "#1f2938",
              },
              textarea: {
                border: "1px solid !important",
                borderColor:
                  theme.colorScheme === "light"
                    ? "#E5E7EB !important"
                    : "#384152 !important",
                borderRadius: "8px",
                margin: "8px 0px 0px 0px",
                boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
                backgroundColor:
                  theme.colorScheme === "light" ? "white" : "#384152",
                ":focus": {
                  outline: "solid 1px #E85921 !important",
                  outlineOffset: "-1px",
                },
              },
            },
            ".sidePanel": {
              border: "1px solid",
              borderColor:
                theme.colorScheme === "light" ? "#E5E7EB" : "#384152",
              borderLeft: "none",
              borderTopRightRadius: "8px",
              borderBottomRightRadius: "8px",
              background:
                theme.colorScheme === "light"
                  ? "linear-gradient(90deg, #F6F6F6, #FFFFFF)"
                  : "transparent",
              input: {
                border: "1px solid #E5E7EB !important",
                boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
                backgroundColor: "#ffffff",
                ":focus": {
                  outline: "solid 1px #E85921 !important",
                  outlineOffset: "-1px",
                },
              },
            },
            ".divider": {
              borderTopWidth: "1px",
              borderTopColor: "rgba(226,232,255,.1)",
              marginBottom: "0.5em",
            },
            ".runPromptButton": {
              borderRadius: "8px",
              border: "1px solid #FDD7AD",
              background: "linear-gradient(180deg, #FEE1C0 0%, #FCC792 100%)",
              boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05)",
              margin: "4px",
              height: "auto",
              color: "#E85921",
              path: {
                color: "#E85921",
              },
              ":hover": {
                background: "linear-gradient(180deg, #FEE1C0 0%, #FF9E3D 100%)",
              },
            },
            ".actionTabsPanel": {
              width: "400px",
            },
            ".logo": {
              maxWidth: "80rem",
              margin: "0 auto",
              padding: "32px 0 0 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            },

            ".parametersContainer": {
              maxWidth: "1250px",
              maxHeight: "-webkit-fill-available",
              margin: "16px auto",
              padding: "0",
              backgroundColor:
                theme.colorScheme === "light" ? "#F9FAFB" : "#1f2938",
              borderRadius: "8px",
              border: "1px solid",
              borderColor:
                theme.colorScheme === "light" ? "#E5E7EB" : "#384152",
              button: {
                ":hover": {
                  backgroundColor:
                    theme.colorScheme === "light" ? "#F0F1F1" : "transparent",
                },
              },
              input: {
                border: "1px solid !important",
                borderColor:
                  theme.colorScheme === "light"
                    ? "#E5E7EB !important"
                    : "#384152 !important",
                boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
                borderRadius: "8px",
                backgroundColor:
                  theme.colorScheme === "light" ? "white" : "#384152",
                ":focus": {
                  outline: "solid 1px #E85921 !important",
                  outlineOffset: "-1px",
                },
              },
              textarea: {
                border: "1px solid !important",
                borderColor:
                  theme.colorScheme === "light"
                    ? "#E5E7EB !important"
                    : "#384152 !important",
                boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
                borderRadius: "8px",
                backgroundColor:
                  theme.colorScheme === "light" ? "white" : "#384152",
                ":focus": {
                  outline: "solid 1px #E85921 !important",
                  outlineOffset: "-1px",
                },
              },
              ".addParameterButton": {
                position: "sticky",
                left: "0",
                bottom: "0",
                margin: "16px 0 0 0",
                background: "linear-gradient(180deg, #FEE1C0 0%, #FCC792 100%)",
                path: {
                  color: "#E85921",
                },
              },
            },

            ".mantine-Slider-thumb": {
              border: "0.25rem solid #E85921",
            },
            ".mantine-Slider-bar": {
              backgroundColor: "#E85921",
            },
            ".mantine-Tabs-tab[data-active]": {
              borderBottom: "solid 1px #E85921",
              ":hover": {
                borderBottom: "solid 1px #E85921",
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
