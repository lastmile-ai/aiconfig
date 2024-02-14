<script lang="ts">
  //@ts-ignore Import IS used by react:GradioWorkbook below
  import GradioWorkbook from "./GradioWorkbook";
  import { client } from "@gradio/client";

  import "./styles.css";

  import type { Gradio } from "@gradio/utils";
  import { Block } from "@gradio/atoms";
  import { StatusTracker } from "@gradio/statustracker";
  import type { LoadingStatus } from "@gradio/statustracker";
  import type { SelectData } from "@gradio/utils";
  import {
    type RunPromptStreamCallback,
    type RunPromptStreamErrorCallback,
  } from "@lastmileai/aiconfig-editor";
  import type {
    AIConfig,
    InferenceSettings,
    JSONObject,
    Prompt,
  } from "aiconfig";

  type EventWithSessionIdData = {
    session_id: string;
  };

  type AddPromptEventData = EventWithSessionIdData & {
    prompt_name: string;
    prompt: Prompt;
    index: number;
  };

  // CancelRunEventData is used by the client to cancel a running threadID.
  // We don't directly interact with an AIConfig during this event so we
  // don't need to pass a session_id
  type CancelRunEventData = {
    cancellation_token_id: string;
  };

  type DeletePromptEventData = EventWithSessionIdData & {
    prompt_name: string;
  };

  type RunPromptEventData = EventWithSessionIdData & {
    api_token?: string;
    cancellation_token?: string;
    prompt_name: string;
  };

  type SetConfigDescriptionEventData = EventWithSessionIdData & {
    description: string;
  };

  type SetConfigNameEventData = EventWithSessionIdData & {
    name: string;
  };

  type SetParametersEventData = EventWithSessionIdData & {
    parameters: JSONObject;
    prompt_name?: string;
  };

  type ShareConfigEventData = EventWithSessionIdData & {
    workspace_url: string;
  };

  type UpdateModelEventData = EventWithSessionIdData & {
    model_name?: string;
    model_settings?: InferenceSettings;
    prompt_name?: string;
  };

  type UpdatePromptEventData = EventWithSessionIdData & {
    prompt_name: string;
    prompt: Prompt;
  };

  export let elem_id = "";
  export let elem_classes: string[] = [];
  export let visible = true;

  // Gradio color theme, per https://www.gradio.app/guides/sharing-your-app
  export let theme_mode: "dark" | "light" | "system" = "system";

  // We obtain a serialized JSON string from the backend, containing
  // the aiconfig and model_ids
  export let value: string;
  let parsedValue: any;
  let aiconfig: AIConfig | undefined;
  let model_ids: string[] = [];
  let hasModifiedAIConfig: boolean = false;

  // TODO: Can we just return the objects instead of serializing?
  type EventAPIResponse = {
    // Gradio client returns data as an array
    // (https://github.com/gradio-app/gradio/blob/main/client/js/src/client.ts#L40)
    // We return a JSON string on the server for the array value, so it results
    // in an array of strings
    data: string[];
  };

  // Root is provided to the component with the hostname. Rename below for clarity
  export let root: string;
  let HOST_ENDPOINT: string;
  $: {
    if (root != null) {
      HOST_ENDPOINT = root;
    }
  }

  // Create a session id for every new client. We use this so that each client
  // has their own copy of an AIConfig so that when they make changes to it,
  // it doesn't overwrite the original AIConfig stored on the server
  const sessionId: string = Math.random().toString(36).substring(2);

  $: {
    try {
      if (value != null) {
        parsedValue = JSON.parse(value);
        const currentAIConfig: AIConfig | undefined =
          parsedValue.aiconfig ?? parsedValue.aiconfig_chunk;
        if (currentAIConfig) {
          aiconfig = currentAIConfig;
        }
        if (parsedValue.model_ids) {
          model_ids = parsedValue.model_ids;
        }
      }
    } catch (e) {
      console.error("Invalid JSON value passed to GradioNotebook", e);
    }
  }

  export let container = true;
  export let scale: number | null = null;
  export let min_width: number | undefined = undefined;
  export let loading_status: LoadingStatus;
  export let gradio: Gradio<{
    change: never;
    select: SelectData;
    input: never;
    add_prompt: AddPromptEventData;
    cancel_run: CancelRunEventData;
    clear_outputs: EventWithSessionIdData;
    delete_prompt: DeletePromptEventData;
    get_aiconfig: EventWithSessionIdData;
    remove_session_id: EventWithSessionIdData;
    run_prompt: RunPromptEventData;
    set_config_description: SetConfigDescriptionEventData;
    set_config_name: SetConfigNameEventData;
    set_parameters: SetParametersEventData;
    share_config: ShareConfigEventData;
    update_model: UpdateModelEventData;
    update_prompt: UpdatePromptEventData;
  }>;

  let gradioClient: any;
  async function getClient() {
    if (!gradioClient) {
      gradioClient = await client(`${HOST_ENDPOINT}`, {
        /*options*/
      });
    }
    return gradioClient;
  }

  async function handleAddPrompt(
    prompt_name: string,
    prompt: Prompt,
    index: number
  ) {
    const client = await getClient();
    const res = (await client.predict("/add_prompt_impl", undefined, {
      prompt_name,
      prompt,
      index,
      session_id: sessionId,
    })) as EventAPIResponse;

    hasModifiedAIConfig = true;
    return JSON.parse(res.data[0]);
  }

  async function handleCancel(cancellation_token_id: string) {
    const client = await getClient();
    await client.predict("/cancel_run_impl", undefined, {
      cancellation_token_id,
    });
  }

  async function handleClearOutputs() {
    const client = await getClient();
    const res = (await client.predict("/clear_outputs_impl", undefined, {
      session_id: sessionId,
    })) as EventAPIResponse;

    hasModifiedAIConfig = true;
    return JSON.parse(res.data[0]);
  }

  async function handleDeletePrompt(prompt_name: string) {
    const client = await getClient();
    await client.predict("/delete_prompt_impl", undefined, {
      prompt_name,
      session_id: sessionId,
    });
    hasModifiedAIConfig = true;
  }

  async function handleDownload() {
    const client = await getClient();
    const response = (await client.predict("/get_aiconfig_impl", undefined, {
      session_id: sessionId,
    })) as EventAPIResponse;
    const { aiconfig } = JSON.parse(response.data[0]);

    const jsonBlob: Blob = new Blob([JSON.stringify(aiconfig, null, 2)], {
      type: "application/json",
    });
    const fileURL: string = window.URL.createObjectURL(jsonBlob);

    // Specify a unique filename for the saved file. If not unique, duplicates would
    // be saved as <name>.aiconfig(1).json since extension is handled as .json only
    const currentDate = new Date();
    const year = String(currentDate.getFullYear());
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(currentDate.getDate()).padStart(2, "0");
    const hours = String(currentDate.getHours()).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");
    const seconds = String(currentDate.getSeconds()).padStart(2, "0");
    const fileNamePrefix = aiconfig?.name ?? "Gradio Notebook";
    const fileName = `${fileNamePrefix} ${year}-${month}-${day} at ${hours}:${minutes}:${seconds}.aiconfig.json`;

    const anchorElement = document.createElement("a");
    anchorElement.href = fileURL;
    anchorElement.download = fileName;

    // "Click" the anchor element to trigger a download
    anchorElement.click();

    // After downloading, unregister the blob URL and anchor element
    window.URL.revokeObjectURL(fileURL);
    anchorElement.remove();
  }

  // TODO (rossdanlm): Implement this on the backend w. re.predicate
  function handleGetModels(search: string) {
    return model_ids.filter((model_id) =>
      model_id.toLowerCase().includes(search.toLowerCase())
    );
  }

  // TODO: Refactor runPrompt callback to make stream/error callbacks optional
  async function handleRunPrompt(
    prompt_name: string,
    onStream: RunPromptStreamCallback,
    onError: RunPromptStreamErrorCallback,
    _enable_streaming?: boolean,
    cancellation_token?: string
  ) {
    const client = await getClient();
    const data: RunPromptEventData = {
      prompt_name,
      cancellation_token,
      session_id: sessionId,
      api_token: userApiToken,
    };

    // Use submit instead of predict to handle streaming from generator endpoint
    // See https://www.gradio.app/guides/getting-started-with-the-js-client#generator-endpoints
    const stream = await client.submit("/run_prompt_impl", undefined, data);

    // Hacky, but gradio seems to be double-dipatching the final event. For error
    // or stop_streaming this results in duplicate notifications showing for the event.
    // For now, just use a flag to ignore the duplicate event. Using one flag for each
    // event just to be extra safe, in case we ever have stop_streaming AND error
    let stop_streaming_event_received = false;
    let error_event_received = false;

    stream.on("data", (dataEvent: EventAPIResponse) => {
      const event = JSON.parse(dataEvent.data[0] as string);

      const eventType = Object.keys(event)[0] as
        | "aiconfig_chunk"
        | "output_chunk"
        | "stop_streaming"
        | "error";

      switch (eventType) {
        case "error":
          if (!error_event_received) {
            onError({
              type: "error",
              data: {
                message: event.error.message ?? "Unknown error",
                code: event.error.code ? parseInt(event.error.code) : 500,
                data: event.error.data,
              },
            });
            error_event_received = true;
          }
          break;
        case "stop_streaming":
          if (!stop_streaming_event_received) {
            onStream({
              type: "stop_streaming",
              data: event[eventType],
            });
            stop_streaming_event_received = true;
          }
          break;
        default:
          onStream({
            type: eventType,
            data: event[eventType],
          });
          break;
      }
    });
    hasModifiedAIConfig = true;
  }

  let userApiToken: string | undefined;
  async function handleSetApiToken(apiToken: string) {
    userApiToken = apiToken;
    // Reconstruct the client with updated token, if valid, otherwise clear it
    if (userApiToken.startsWith("hf_")) {
      gradioClient = await client(`${HOST_ENDPOINT}`, {
        hf_token: userApiToken as `hf_${string}`, // gradio has weird typing for this...
      });
    } else {
      gradioClient = await client(`${HOST_ENDPOINT}`, {
        // options
      });
    }
  }

  async function handleSetConfigDescription(description: string) {
    const client = await getClient();
    await client.predict("/set_config_description_impl", undefined, {
      description,
      session_id: sessionId,
    });
    hasModifiedAIConfig = true;
  }

  async function handleSetConfigName(name: string) {
    const client = await getClient();
    await client.predict("/set_config_name_impl", undefined, {
      name,
      session_id: sessionId,
    });
    hasModifiedAIConfig = true;
  }

  async function handleSetParameters(
    parameters: JSONObject,
    prompt_name?: string
  ) {
    const client = await getClient();
    await client.predict("/set_parameters_impl", undefined, {
      parameters,
      prompt_name,
      session_id: sessionId,
    });
    hasModifiedAIConfig = true;
  }

  async function handleShare() {
    const client = await getClient();
    const res = (await client.predict("/share_config_impl", undefined, {
      session_id: sessionId,
      workspace_url: window.location.href,
    })) as EventAPIResponse;
    return JSON.parse(res.data[0]);
  }

  function handleUpdateModel(updateRequest: {
    modelName?: string;
    settings?: InferenceSettings;
    promptName?: string;
  }) {
    gradio.dispatch("update_model", {
      prompt_name: updateRequest.promptName,
      model_name: updateRequest.modelName,
      model_settings: updateRequest.settings,
      session_id: sessionId,
    });
    hasModifiedAIConfig = true;
  }

  async function handleUpdatePrompt(prompt_name: string, prompt: Prompt) {
    const client = await getClient();
    const res = (await client.predict("/update_prompt_impl", undefined, {
      prompt_name,
      prompt,
      session_id: sessionId,
    })) as EventAPIResponse;

    hasModifiedAIConfig = true;
    return JSON.parse(res.data[0]);
  }

  function beforeUnload(event: BeforeUnloadEvent) {
    if (hasModifiedAIConfig) {
      event.preventDefault();
      event.returnValue = true;
      return "does not matter"; // Chrome requires us to return arbitrary string
    }
    return undefined;
  }

  window.onpagehide = (event) => {
    if (!event.persisted && gradioClient) {
      gradioClient.predict("/remove_session_id_impl", undefined, {
        session_id: sessionId,
      });
    }
  };
</script>

<svelte:window on:beforeunload={beforeUnload} />

<Block {visible} {elem_id} {elem_classes} {container} {scale} {min_width}>
  {#if loading_status}
    <StatusTracker
      autoscroll={gradio.autoscroll}
      i18n={gradio.i18n}
      {...loading_status}
    />
  {/if}
  <react:GradioWorkbook
    {aiconfig}
    editorCallbacks={{
      addPrompt: handleAddPrompt,
      cancel: handleCancel,
      clearOutputs: handleClearOutputs,
      deletePrompt: handleDeletePrompt,
      download: handleDownload,
      getModels: handleGetModels,
      runPrompt: handleRunPrompt,
      setConfigDescription: handleSetConfigDescription,
      setConfigName: handleSetConfigName,
      setParameters: handleSetParameters,
      share: handleShare,
      updateModel: handleUpdateModel,
      updatePrompt: handleUpdatePrompt,
    }}
    onSetApiToken={handleSetApiToken}
    themeMode={theme_mode}
  />
</Block>
