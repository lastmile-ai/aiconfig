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
          colorScheme: "dark",

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

          // local editor theme
          globalStyles: (local) => ({
            ".editorBackground": {
              background:
                "radial-gradient(ellipse at top,#08122d,#030712),radial-gradient(ellipse at bottom,#030712,#030712)",
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
                border: "none",
                borderRadius: "4px",
                padding: "4px",
                margin: "0px",
                backgroundColor: "transparent",
                ":hover": {
                  backgroundColor: "rgba(226,232,255,.1)",
                },
              },
            },
            ".cellStyle": {
              border: "1px solid rgba(226,232,255,.1) !important",
              background: "rgb(12 21 57 / 10%)",
              flex: 1,
              borderTopRightRadius: "0px",
              borderBottomRightRadius: "0px",
              ":hover": {
                background: "rgba(255, 255, 255, 0.03) !important",
              },
              textarea: {
                border: "1px solid rgba(226,232,255,.1)",
                backgroundColor: "#060c21",
                ":focus": {
                  outline: "solid 1px #ff1cf7 !important",
                  outlineOffset: "-1px",
                },
              },
            },
            ".sidePanel": {
              border: "1px solid rgba(226,232,255,.1)",
              borderLeft: "none",
              borderTopRightRadius: "4px",
              borderBottomRightRadius: "4px",
              input: {
                border: "1px solid rgba(226,232,255,.1)",
                backgroundColor: "#060c21",
                ":focus": {
                  outline: "solid 1px #ff1cf7 !important",
                  outlineOffset: "-1px",
                },
              },
              textarea: {
                border: "1px solid rgba(226,232,255,.1)",
                backgroundColor: "#060c21",
                ":focus": {
                  outline: "solid 1px #ff1cf7 !important",
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
              background: "#ff1cf7",
              color: "white",
              borderRadius: "0",
              height: "auto",
              "&:hover": {
                background: "#ff46f8",
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
              backgroundColor: "rgba(226,232,255,.1)",
              borderRadius: "4px",
              border: "1px solid rgba(226,232,255,.1) !important",
              button: {
                ":hover": {
                  backgroundColor: "rgba(226,232,255,.1)",
                },
              },
              input: {
                border: "1px solid rgba(226,232,255,.1)",
                backgroundColor: "#060c21",
                borderRadius: "4px",
                ":focus": {
                  outline: "solid 1px #ff1cf7 !important",
                  outlineOffset: "-1px",
                },
              },
              textarea: {
                border: "1px solid rgba(226,232,255,.1)",
                backgroundColor: "#060c21",
                borderRadius: "4px",
                ":focus": {
                  outline: "solid 1px #ff1cf7 !important",
                  outlineOffset: "-1px",
                },
              },
            },
            ".addParameterButton": {
              position: "sticky",
              left: "0",
              bottom: "0",
              margin: "16px 0 0 0",
              background: "#ff1cf7",
              "&:hover": {
                background: "#ff46f8",
              },
            },
            ".mantine-InputWrapper-label": {
              display: "none",
            },
            ".mantine-Slider-thumb": {
              border: "0.25rem solid #ff1cf7",
              backgroundColor: "white",
            },
            ".mantine-Slider-bar": {
              backgroundColor: "#ff1cf7",
            },
            ".mantine-Tabs-tab[data-active]": {
              borderBottom: "solid 1px #ff1cf7",
              ":hover": {
                borderBottom: "solid 1px #ff1cf7",
              },
            },
          }),
        }}
      >
        <div className="logo">
          <Image
            withPlaceholder
            maw={140}
            src="images/aiconfigLogo.png"
            alt="AiConfig Logo"
          />
        </div>
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
