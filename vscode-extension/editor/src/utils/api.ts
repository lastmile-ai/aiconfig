import urlJoin from "url-join";

const API_ENDPOINT = `/api`;

export const ROUTE_TABLE = {
  ADD_PROMPT: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/add_prompt"),
  CANCEL: (hostUrl: string) => urlJoin(hostUrl, API_ENDPOINT, "/cancel"),
  CLEAR_OUTPUTS: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/clear_outputs"),
  DELETE_MODEL: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/delete_model"),
  DELETE_OUTPUT: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/delete_output"),
  DELETE_PROMPT: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/delete_prompt"),
  GET_AICONFIGRC: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/get_aiconfigrc"),
  SAVE: (hostUrl: string) => urlJoin(hostUrl, API_ENDPOINT, "/save"),
  TO_STRING: (hostUrl: string) => urlJoin(hostUrl, API_ENDPOINT, "/to_string"),
  SET_DESCRIPTION: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/set_description"),
  SERVER_STATUS: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/server_status"),
  SET_NAME: (hostUrl: string) => urlJoin(hostUrl, API_ENDPOINT, "/set_name"),
  SET_PARAMETERS: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/set_parameters"),
  LOAD: (hostUrl: string) => urlJoin(hostUrl, API_ENDPOINT, "/load"),
  LOAD_CONTENT: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/load_content"),
  LIST_MODELS: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/list_models"),
  RUN_PROMPT: (hostUrl: string) => urlJoin(hostUrl, API_ENDPOINT, "/run"),
  UPDATE_MODEL: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/update_model"),
  UPDATE_PROMPT: (hostUrl: string) =>
    urlJoin(hostUrl, API_ENDPOINT, "/update_prompt"),
};
