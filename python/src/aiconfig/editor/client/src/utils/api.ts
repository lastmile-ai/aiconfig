import urlJoin from "url-join";

// For development, run the python server at port 8080
// For prod, client is bundled and served by the python server at the same port as
// the server so use "/" as the host endpoint and the port doesn't matter
const HOST_ENDPOINT =
  process.env.NODE_ENV === "development" ? "http://localhost:8080" : "";

const API_ENDPOINT = `${HOST_ENDPOINT}/api`;

export const ROUTE_TABLE = {
  ADD_PROMPT: urlJoin(API_ENDPOINT, "/add_prompt"),
  CANCEL: urlJoin(API_ENDPOINT, "/cancel"),
  CLEAR_OUTPUTS: urlJoin(API_ENDPOINT, "/clear_outputs"),
  DELETE_PROMPT: urlJoin(API_ENDPOINT, "/delete_prompt"),
  SAVE: urlJoin(API_ENDPOINT, "/save"),
  SET_DESCRIPTION: urlJoin(API_ENDPOINT, "/set_description"),
  SERVER_STATUS: urlJoin(API_ENDPOINT, "/server_status"),
  SET_NAME: urlJoin(API_ENDPOINT, "/set_name"),
  SET_PARAMETERS: urlJoin(API_ENDPOINT, "/set_parameters"),
  LOAD: urlJoin(API_ENDPOINT, "/load"),
  LIST_MODELS: urlJoin(API_ENDPOINT, "/list_models"),
  RUN_PROMPT: urlJoin(API_ENDPOINT, "/run"),
  UPDATE_MODEL: urlJoin(API_ENDPOINT, "/update_model"),
  UPDATE_PROMPT: urlJoin(API_ENDPOINT, "/update_prompt"),
};
