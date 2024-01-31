import * as vscode from "vscode";
import type { ChildProcessWithoutNullStreams } from "child_process";
import { setTimeout } from "timers/promises";
import { ufetch } from "ufetch";

import path from "path";

export const EXTENSION_NAME = "vscode-aiconfig";
export const COMMANDS = {
  INIT: `${EXTENSION_NAME}.init`,
  HELLO_WORLD: `${EXTENSION_NAME}.helloWorld`,
};

const EDITOR_SERVER_API_ENDPOINT = `/api`;

export const EDITOR_SERVER_ROUTE_TABLE = {
  TO_STRING: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/to_string"),
  SERVER_STATUS: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/server_status"),
  LOAD_CONTENT: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/load_content"),
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
  return await ufetch.post(EDITOR_SERVER_ROUTE_TABLE.LOAD_CONTENT(serverUrl), {
    content: document.getText(),
    mode: getModeFromDocument(document),
  });
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

export async function getDocumentFromServer(
  serverUrl: string,
  document: vscode.TextDocument
): Promise<string> {
  const res = await ufetch.post(
    EDITOR_SERVER_ROUTE_TABLE.TO_STRING(serverUrl),
    {
      mode: getModeFromDocument(document),
      include_outputs: true,
    }
  );

  // TODO: saqadri - handle error cases
  return res.aiconfig_string;
}

//#region url-join
function normalize(strArray) {
  const resultArray = [];
  if (strArray.length === 0) {
    return "";
  }

  // Filter out any empty string values.
  strArray = strArray.filter((part) => part !== "");

  if (typeof strArray[0] !== "string") {
    throw new TypeError("Url must be a string. Received " + strArray[0]);
  }

  // If the first part is a plain protocol, we combine it with the next part.
  if (strArray[0].match(/^[^/:]+:\/*$/) && strArray.length > 1) {
    strArray[0] = strArray.shift() + strArray[0];
  }

  // If the first part is a leading slash, we combine it with the next part.
  if (strArray[0] === "/" && strArray.length > 1) {
    strArray[0] = strArray.shift() + strArray[0];
  }

  // There must be two or three slashes in the file protocol, two slashes in anything else.
  if (strArray[0].match(/^file:\/\/\//)) {
    strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, "$1:///");
  } else {
    strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, "$1://");
  }

  for (let i = 0; i < strArray.length; i++) {
    let component = strArray[i];

    if (typeof component !== "string") {
      throw new TypeError("Url must be a string. Received " + component);
    }

    if (i > 0) {
      // Removing the starting slashes for each component but the first.
      component = component.replace(/^[\/]+/, "");
    }
    if (i < strArray.length - 1) {
      // Removing the ending slashes for each component but the last.
      component = component.replace(/[\/]+$/, "");
    } else {
      // For the last component we will combine multiple slashes to a single one.
      component = component.replace(/[\/]+$/, "/");
    }

    if (component === "") {
      continue;
    }

    resultArray.push(component);
  }

  let str = "";

  for (let i = 0; i < resultArray.length; i++) {
    const part = resultArray[i];

    // Do not add a slash if this is the first part.
    if (i === 0) {
      str += part;
      continue;
    }

    const prevPart = resultArray[i - 1];

    // Do not add a slash if the previous part ends with start of the query param or hash.
    if ((prevPart && prevPart.endsWith("?")) || prevPart.endsWith("#")) {
      str += part;
      continue;
    }

    str += "/" + part;
  }
  // Each input component is now separated by a single slash except the possible first plain protocol part.

  // remove trailing slash before parameters or hash
  str = str.replace(/\/(\?|&|#[^!])/g, "$1");

  // replace ? and & in parameters with &
  const [beforeHash, afterHash] = str.split("#");
  const parts = beforeHash.split(/(?:\?|&)+/).filter(Boolean);
  str =
    parts.shift() +
    (parts.length > 0 ? "?" : "") +
    parts.join("&") +
    (afterHash && afterHash.length > 0 ? "#" + afterHash : "");

  return str;
}

export function urlJoin(...args) {
  const parts = Array.from(Array.isArray(args[0]) ? args[0] : args);
  return normalize(parts);
}
//#endregion