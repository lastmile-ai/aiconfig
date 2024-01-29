import AIConfigEditor, {
  AIConfigCallbacks,
  RunPromptCompleteCallback,
  RunPromptStreamCallback,
  RunPromptStreamErrorCallback,
  RunPromptStreamErrorEvent,
} from "./components/AIConfigEditor";
import {
  Flex,
  Loader,
  MantineProvider,
  MantineThemeOverride,
} from "@mantine/core";
import {
  AIConfig,
  InferenceSettings,
  JSONObject,
  Output,
  Prompt,
} from "aiconfig";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ufetch } from "ufetch";
import { HOST_ENDPOINT, ROUTE_TABLE } from "./utils/api";
import { streamingApiChain } from "./utils/oboeHelpers";
import WebviewContext from "./WebviewContext";
import {
  getWebviewState,
  notifyDocumentDirty,
  sendMessage,
  setWebviewState,
  updateWebviewState,
} from "./utils/vscodeUtils";
import { set } from "lodash";

export default function Editor() {
  const { vscode } = useContext(WebviewContext);

  // TODO: does this need to be wrapped in a memo?
  const webviewState = getWebviewState(vscode);
  console.log(`webviewState = ${JSON.stringify(webviewState)}`);

  const [aiconfig, setAIConfig] = useState<AIConfig | undefined>();
  const [aiConfigServerUrl, setAIConfigServerUrl] = useState<string>(
    webviewState?.serverUrl ?? ""
  );

  const [callbacksByPromptName, setCallbacksByPromptName] = useState<{
    [promptName: string]: {
      onStream: RunPromptStreamCallback;
      onError: RunPromptStreamErrorCallback;
      onComplete: RunPromptCompleteCallback;
    };
  }>({});

  const updateContent = useCallback(async (text: string) => {
    // TODO: saqadri - this won't work for YAML -- the handling of the text needs to include the logic from AIConfig.load
    const updatedConfig = text != null ? JSON.parse(text) : {};
    setAIConfig(updatedConfig);

    // Then persist state information.
    // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
    //vscode?.setState({ text });

    // TODO: saqadri - as soon as content is updated, we have to call /load endpoint for the server to have the latest content as well
    // However, instead of loading from FS, the /load endpoint should load from the data passed to it here.
  }, []);

  const webviewMessageHandler = useCallback(
    (event: MessageEvent) => {
      //console.log("onMessage, event=", JSON.stringify(event));
      const message = event.data; // The json data that the extension sent
      if (!message) {
        console.log("onMessage, MESSAGE=NULL, event=", JSON.stringify(event));
        return;
      }

      switch (message.type) {
        case "update": {
          console.log("onMessage, message=", JSON.stringify(message));
          const text = message.text;

          // Update our webview's content
          updateContent(text);
          return;
        }
        case "set_server_url": {
          console.log("onMessage, message=", JSON.stringify(message));
          const url = message.url;
          setAIConfigServerUrl(url);
          updateWebviewState(vscode, { serverUrl: url });

          // TODO: saqadri - as soon as content is updated, we have to call
          // /get endpoint so we get the latest content from the server
          return;
        }
        case "on_run_start": {
          console.log(
            "onMessage on_run_start, message=",
            JSON.stringify(message)
          );

          const promptName: string = message.promptName;
          return;
        }
        case "on_run_stream_update": {
          console.log(
            "onMessage on_stream_update, message=",
            JSON.stringify(message)
          );

          const promptName: string = message.promptName;
          console.log(
            `callbacksByPromptName=${JSON.stringify(
              callbacksByPromptName
            )}, promptName=${promptName}`
          );

          callbacksByPromptName[promptName].onStream(message.data);

          return;
        }
        case "on_run_stream_error": {
          console.log(
            "onMessage on_stream_error, message=",
            JSON.stringify(message)
          );

          const promptName: string = message.promptName;
          console.log(
            `2callbacksByPromptName=${JSON.stringify(
              callbacksByPromptName
            )}, promptName=${promptName}`
          );

          callbacksByPromptName[promptName].onError(message.error);

          return;
        }
        case "on_run_complete": {
          console.log(
            "onMessage on_run_complete, message=",
            JSON.stringify(message)
          );

          const promptName: string = message.promptName;
          console.log(
            `3callbacksByPromptName=${JSON.stringify(
              callbacksByPromptName
            )}, promptName=${promptName}`
          );

          callbacksByPromptName[promptName].onComplete(message.result);

          return;
        }
        default: {
          console.log("onMessage, UNHANDLED message=", JSON.stringify(message));
        }
      }
    },
    [callbacksByPromptName, updateContent, vscode]
  );

  // Handle messages sent from the extension to the webview
  // window.addEventListener("message", (event) => {
  //   //console.log("onMessage, event=", JSON.stringify(event));
  //   const message = event.data; // The json data that the extension sent
  //   if (!message) {
  //     console.log("onMessage, MESSAGE=NULL, event=", JSON.stringify(event));
  //     return;
  //   }

  //   switch (message.type) {
  //     case "update": {
  //       console.log("onMessage, message=", JSON.stringify(message));
  //       const text = message.text;

  //       // Update our webview's content
  //       updateContent(text);
  //       return;
  //     }
  //     case "set_server_url": {
  //       console.log("onMessage, message=", JSON.stringify(message));
  //       const url = message.url;
  //       setAIConfigServerUrl(url);
  //       updateWebviewState(vscode, { serverUrl: url });

  //       // TODO: saqadri - as soon as content is updated, we have to call
  //       // /get endpoint so we get the latest content from the server
  //       return;
  //     }
  //     case "on_run_start": {
  //       console.log(
  //         "onMessage on_run_start, message=",
  //         JSON.stringify(message)
  //       );

  //       const promptName: string = message.promptName;
  //       return;
  //     }
  //     case "on_run_stream_update": {
  //       console.log(
  //         "onMessage on_stream_update, message=",
  //         JSON.stringify(message)
  //       );

  //       const promptName: string = message.promptName;
  //       console.log(
  //         `callbacksByPromptName=${JSON.stringify(
  //           callbacksByPromptName
  //         )}, promptName=${promptName}`
  //       );

  //       callbacksByPromptName[promptName].onStream(message.data);

  //       return;
  //     }
  //     case "on_run_stream_error": {
  //       console.log(
  //         "onMessage on_stream_error, message=",
  //         JSON.stringify(message)
  //       );

  //       const promptName: string = message.promptName;
  //       console.log(
  //         `2callbacksByPromptName=${JSON.stringify(
  //           callbacksByPromptName
  //         )}, promptName=${promptName}`
  //       );

  //       callbacksByPromptName[promptName].onError(message.error);

  //       return;
  //     }
  //     case "on_run_complete": {
  //       console.log(
  //         "onMessage on_run_complete, message=",
  //         JSON.stringify(message)
  //       );

  //       const promptName: string = message.promptName;
  //       console.log(
  //         `3callbacksByPromptName=${JSON.stringify(
  //           callbacksByPromptName
  //         )}, promptName=${promptName}`
  //       );

  //       callbacksByPromptName[promptName].onComplete(message.result);

  //       return;
  //     }
  //     default: {
  //       console.log("onMessage, UNHANDLED message=", JSON.stringify(message));
  //     }
  //   }
  // });

  useEffect(() => {
    //if (window.eventListe)
    window.removeEventListener("message", webviewMessageHandler);
    window.addEventListener("message", webviewMessageHandler);
  }, [webviewMessageHandler]);

  const loadConfig = useCallback(async () => {
    const route = ROUTE_TABLE.LOAD(aiConfigServerUrl);
    console.log(
      `IN LOAD: route=${route}, aiconfigServerUrl=${aiConfigServerUrl}`
    );

    const res = await ufetch.post(route, {});
    console.log(`IN LOAD: route=${route}, res=${JSON.stringify(res)}`);
    setAIConfig(res.aiconfig);
  }, [aiConfigServerUrl]);

  useEffect(() => {
    if (aiConfigServerUrl !== "") {
      // This is less important for the first load, but when the webview gets dehydrated and rehydrated,
      // we'll get the aiConfigServerUrl from the webview state. This will trigger a reload of the config.
      loadConfig();
    }
  }, [aiConfigServerUrl, loadConfig]);

  const save = useCallback(
    async (aiconfig: AIConfig) => {
      console.log("BAD WE SHOULD NEVER GET HERE");
      const res = await ufetch.post(ROUTE_TABLE.SAVE(aiConfigServerUrl), {
        // path: file path,
        aiconfig,
      });

      return res;
    },
    [aiConfigServerUrl]
  );

  const getModels = useCallback(
    async (search: string) => {
      // For now, rely on caching and handle client-side search filtering
      // We will use server-side search filtering for Gradio
      const res = await ufetch.get(ROUTE_TABLE.LIST_MODELS(aiConfigServerUrl));
      const models = res.data;
      if (search && search.length > 0) {
        const lowerCaseSearch = search.toLowerCase();
        return models.filter(
          (model: string) =>
            model.toLocaleLowerCase().indexOf(lowerCaseSearch) >= 0
        );
      }
      return models;
    },
    [aiConfigServerUrl]
  );

  const addPrompt = useCallback(
    async (promptName: string, promptData: Prompt, index: number) => {
      const res = await ufetch.post(ROUTE_TABLE.ADD_PROMPT(aiConfigServerUrl), {
        prompt_name: promptName,
        prompt_data: promptData,
        index,
      });

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const deletePrompt = useCallback(
    async (promptName: string) => {
      const res = await ufetch.post(
        ROUTE_TABLE.DELETE_PROMPT(aiConfigServerUrl),
        {
          prompt_name: promptName,
        }
      );

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const clearOutputs = useCallback(async () => {
    const res = await ufetch.post(
      ROUTE_TABLE.CLEAR_OUTPUTS(aiConfigServerUrl),
      {}
    );
    if (vscode) {
      notifyDocumentDirty(vscode);
    }
    return res;
  }, [aiConfigServerUrl, vscode]);

  const runPrompt = useCallback(
    async (
      promptName: string,
      promptId: string,
      onStream: RunPromptStreamCallback,
      onError: RunPromptStreamErrorCallback,
      onComplete: RunPromptCompleteCallback,
      enableStreaming: boolean = true,
      cancellationToken?: string
    ) => {
      // if (vscode) {
      //   // Save the callbacks for when we get the response from the extension host
      //   setCallbacksByPromptName((callbacksByPromptName) => {
      //     console.log(
      //       `setCallbacksByPromptName: promptName=${promptName}, prevCallbacksByPromptName=${JSON.stringify(
      //         callbacksByPromptName
      //       )}`
      //     );
      //     return {
      //       ...callbacksByPromptName,
      //       [promptName]: {
      //         onStream,
      //         onError,
      //         onComplete,
      //       },
      //     };
      //   });

      //   // Send the message to the extension host to run the prompt
      //   sendMessage(vscode, {
      //     type: "execute_run",
      //     promptName,
      //     stream: enableStreaming,
      //     cancellationToken,
      //   });
      // }
      // Note: We run the streaming API even for
      // non-streaming runs so that we can unify
      // the way we process data on the client
      const res = await streamingApiChain<{ aiconfig: AIConfig }>(
        {
          url: ROUTE_TABLE.RUN_PROMPT(aiConfigServerUrl),
          //withCredentials: true,
          // headers: {
          //   accept: "*/*",
          //   "accept-language": "en-US,en;q=0.9,es;q=0.8",
          //   "cache-control": "no-cache",
          //   //"content-type": "application/json",
          //   pragma: "no-cache",
          //   // "sec-ch-ua":
          //   //   '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
          //   // "sec-ch-ua-mobile": "?0",
          //   // "sec-ch-ua-platform": '"macOS"',
          //   // "sec-fetch-dest": "empty",
          //   // "sec-fetch-mode": "cors",
          //   // "sec-fetch-site": "same-origin",
          //   "x-requested-with": "XMLHttpRequest",
          // },
          method: "POST",
          body: {
            prompt_name: promptName,
            stream: enableStreaming,
            cancellation_token_id: cancellationToken,
          },
        },
        {
          output_chunk: (data) => {
            console.log("HERE output_chunk");
            onStream({ type: "output_chunk", data: data as Output });
          },
          aiconfig: (data) => {
            console.log("HERE aiconfig");
            onStream({ type: "aiconfig", data: data as AIConfig });
          },
          aiconfig_complete: (data) => {
            console.log("HERE aiconfig_complete");
            onStream({ type: "aiconfig_complete", data: data as AIConfig });
          },
          error: (data) => {
            console.log("HERE error");
            onError({
              type: "error",
              data: data as RunPromptStreamErrorEvent["data"],
            });
          },
        }
      );

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      // TODO: saqadri - update the return type of this function
      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const cancel = useCallback(
    async (cancellationToken: string) => {
      // TODO: saqadri - check the status of the response (can be 400 or 422 if cancellation fails)
      return await ufetch.post(ROUTE_TABLE.CANCEL(aiConfigServerUrl), {
        cancellation_token_id: cancellationToken,
      });
    },
    [aiConfigServerUrl]
  );

  const updatePrompt = useCallback(
    async (promptName: string, promptData: Prompt) => {
      const res = await ufetch.post(
        ROUTE_TABLE.UPDATE_PROMPT(aiConfigServerUrl),
        {
          prompt_name: promptName,
          prompt_data: promptData,
        }
      );

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const updateModel = useCallback(
    async (value: {
      modelName?: string;
      settings?: InferenceSettings;
      promptName?: string;
    }) => {
      const res = await ufetch.post(
        ROUTE_TABLE.UPDATE_MODEL(aiConfigServerUrl),
        {
          model_name: value.modelName,
          settings: value.settings,
          prompt_name: value.promptName,
        }
      );

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const setConfigName = useCallback(
    async (name: string) => {
      const res = await ufetch.post(ROUTE_TABLE.SET_NAME(aiConfigServerUrl), {
        name,
      });

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const setConfigDescription = useCallback(
    async (description: string) => {
      const res = await ufetch.post(
        ROUTE_TABLE.SET_DESCRIPTION(aiConfigServerUrl),
        {
          description,
        }
      );

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const setParameters = useCallback(
    async (parameters: JSONObject, promptName?: string) => {
      const res = await ufetch.post(
        ROUTE_TABLE.SET_PARAMETERS(aiConfigServerUrl),
        {
          parameters,
          prompt_name: promptName,
        }
      );

      if (vscode) {
        notifyDocumentDirty(vscode);
      }

      return res;
    },
    [aiConfigServerUrl, vscode]
  );

  const getServerStatus = useCallback(async () => {
    return await ufetch.get(ROUTE_TABLE.SERVER_STATUS(aiConfigServerUrl));
  }, [aiConfigServerUrl]);

  const callbacks: AIConfigCallbacks = useMemo(
    () => ({
      addPrompt,
      cancel,
      clearOutputs,
      deletePrompt,
      getModels,
      getServerStatus,
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
      cancel,
      clearOutputs,
      deletePrompt,
      getModels,
      getServerStatus,
      runPrompt,
      save,
      setConfigDescription,
      setConfigName,
      setParameters,
      updateModel,
      updatePrompt,
    ]
  );

  const localEditorTheme: MantineThemeOverride = {
    colorScheme: "dark",

    headings: {
      fontFamily:
        "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, Arial, sans-serif",
      sizes: {
        h1: { fontSize: "2rem" },
      },
    },

    defaultGradient: {
      from: "pink",
      to: "pink",
      deg: 45,
    },
    // local editor theme
    globalStyles: () => ({
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
        border: "none",
        borderRadius: "4px",
        padding: "4px",
        margin: "0px",
        backgroundColor: "transparent",
        ":hover": {
          backgroundColor: "rgba(226,232,255,.1)",
        },
        input: {
          maxHeight: "16px",
          fontFamily:
            "sf mono, ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          border: "none",
          borderRadius: "4px",
          padding: "4px",
          margin: "0px",
          backgroundColor: "transparent",
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
        ".mantine-InputWrapper-label": {
          display: "none",
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
  };

  const gradioTheme: MantineThemeOverride = {
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
          backgroundColor: theme.colorScheme === "light" ? "white" : "#384152",
          boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
          ":focus": {
            outline: "solid 1px #E85921 !important",
            outlineOffset: "-1px",
          },
        },
      },
      ".cellStyle": {
        border: "1px solid",
        borderColor: theme.colorScheme === "light" ? "#E5E7EB" : "#384152",
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
          backgroundColor: theme.colorScheme === "light" ? "white" : "#384152",
          ":focus": {
            outline: "solid 1px #E85921 !important",
            outlineOffset: "-1px",
          },
        },
      },
      ".sidePanel": {
        border: "1px solid",
        borderColor: theme.colorScheme === "light" ? "#E5E7EB" : "#384152",
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
        backgroundColor: theme.colorScheme === "light" ? "#F9FAFB" : "#1f2938",
        borderRadius: "8px",
        border: "1px solid",
        borderColor: theme.colorScheme === "light" ? "#E5E7EB" : "#384152",
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
          backgroundColor: theme.colorScheme === "light" ? "white" : "#384152",
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
          backgroundColor: theme.colorScheme === "light" ? "white" : "#384152",
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
  };

  const vscodeTheme: MantineThemeOverride = {
    ...localEditorTheme,
    /* TODO: add VSCode theming */
  };

  return (
    <div className="editorBackground">
      <MantineProvider withGlobalStyles withNormalizeCSS theme={gradioTheme}>
        {!aiconfig ? (
          <Flex justify="center" mt="xl">
            <Loader size="xl" />
          </Flex>
        ) : (
          <AIConfigEditor aiconfig={aiconfig} callbacks={callbacks} />
        )}
      </MantineProvider>
    </div>
  );
}
