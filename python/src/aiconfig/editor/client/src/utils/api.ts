import urlJoin from "url-join";

const API_ENDPOINT = `/api`;

export const ROUTE_TABLE = {
  ADD_PROMPT: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/add_prompt"),
  CANCEL: (hostUrl: string) => urlJoin(hostUrl, API_ENDPOINT, "/cancel"),
  CLEAR_OUTPUTS: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/clear_outputs"),
  DELETE_PROMPT: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/delete_prompt"),
  SAVE: (hostUrl: string) => urlJoin(hostUrl, API_ENDPOINT, "/save"),
  SAVE_TO_STRING: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/save_to_string"),
  SET_DESCRIPTION: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/set_description"),
  SERVER_STATUS: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/server_status"),
  SET_NAME: (hostUrl: string) => urlJoin(hostUrl, API_ENDPOINT, "/set_name"),
  SET_PARAMETERS: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/set_parameters"),
  LOAD: (hostUrl: string) => urlJoin(hostUrl, API_ENDPOINT, "/load"),
  LOAD_WITH_CONTENT: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/load_with_content"),
  LIST_MODELS: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/list_models"),
  RUN_PROMPT: (hostUrl: string) => urlJoin(hostUrl, API_ENDPOINT, "/run"),
  UPDATE_MODEL: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/update_model"),
  UPDATE_PROMPT: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/update_prompt"),
};


// For development, run the python server at port 8080
// For local editor, client is bundled and served by the python server at the same port as
// the server so use "/" as the host endpoint and the port doesn't matter
// For vscode, client (webview) gets notified of the server URL via the "set_server_url" message
export const HOST_ENDPOINT =
  process.env.NODE_ENV === "development" ? "http://localhost:8080" : "";