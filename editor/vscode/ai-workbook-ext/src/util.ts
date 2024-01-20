import * as vscode from "vscode";
import type { ChildProcessWithoutNullStreams } from "child_process";
import { setTimeout } from "timers/promises";
import { ufetch } from "ufetch";
import urlJoin from "url-join";
import path from "path";

export const EXTENSION_NAME = "ai-workbook-ext";

export const COMMANDS = {
  INIT: `${EXTENSION_NAME}.init`,
  HELLO_WORLD: `${EXTENSION_NAME}.helloWorld`,
  HELLO_WORLD_2: `${EXTENSION_NAME}.helloWorld2`,
};

export function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

const EDITOR_SERVER_API_ENDPOINT = `/api`;

export const EDITOR_SERVER_ROUTE_TABLE = {
  ADD_PROMPT: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/add_prompt"),
  CANCEL: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/cancel"),
  CLEAR_OUTPUTS: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/clear_outputs"),
  DELETE_PROMPT: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/delete_prompt"),
  SAVE: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/save"),
  SAVE_TO_STRING: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/save_to_string"),
  SET_DESCRIPTION: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/set_description"),
  SERVER_STATUS: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/server_status"),
  SET_NAME: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/set_name"),
  SET_PARAMETERS: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/set_parameters"),
  LOAD: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/load"),
  LOAD_WITH_CONTENT: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/load_with_content"),
  LIST_MODELS: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/list_models"),
  RUN_PROMPT: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/run"),
  UPDATE_MODEL: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/update_model"),
  UPDATE_PROMPT: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/update_prompt"),
};

export type ServerInfo = {
  proc: ChildProcessWithoutNullStreams;
  url: string;
};

export async function isServerReady(serverUrl: string) {
  try {
    const res = await ufetch.get(
      EDITOR_SERVER_ROUTE_TABLE.SERVER_STATUS(serverUrl)
    );

    const status = res.status;

    return status === "OK";
  } catch (err) {
    return false;
  }
}

export async function waitUntilServerReady(serverUrl: string) {
  // TODO: saqadri - set some max retry to prevent infinite loop
  let ready = await isServerReady(serverUrl);
  while (!ready) {
    // sleep for 100ms
    await setTimeout(/*delay*/ 100);
    ready = await isServerReady(serverUrl);
  }
}

export async function initializeServerState(
  serverUrl: string,
  document: vscode.TextDocument
) {
  return await ufetch.post(
    EDITOR_SERVER_ROUTE_TABLE.LOAD_WITH_CONTENT(serverUrl),
    {
      content: document.getText(),
      mode: getModeFromDocument(document),
    }
  );
}

// Figure out what kind of AIConfig this is that we are loading
export function getModeFromDocument(
  document: vscode.TextDocument
): "json" | "yaml" {
  // determine mode from file path
  const documentPath = document.fileName;
  const ext = path.extname(documentPath)?.toLowerCase();
  if (ext === "yaml" || ext === ".yaml") {
    return "yaml";
  }

  // Default to json-mode
  return "json";
}
