import * as vscode from "vscode";
import type { ChildProcessWithoutNullStreams } from "child_process";
import { setTimeout } from "timers/promises";
import { ufetch } from "ufetch";
import fetch from "node-fetch";
import oboe, { Options } from "oboe";

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

export async function getDocumentFromServer(
  serverUrl: string,
  document: vscode.TextDocument
): Promise<string> {
  const res = await ufetch.post(
    EDITOR_SERVER_ROUTE_TABLE.SAVE_TO_STRING(serverUrl),
    {
      mode: getModeFromDocument(document),
      include_outputs: true,
    }
  );

  // TODO: saqadri - handle error cases
  return res.aiconfig_string;
}

export type RunPromptStreamEvent =
  | {
      type: "output_chunk";
      data: Record<string, unknown>; // AIConfig.Output
    }
  | {
      type: "aiconfig";
      data: Record<string, unknown>; // AIConfig;
    }
  | {
      type: "aiconfig_complete";
      data: Record<string, unknown>; // AIConfig;
    };

export type RunPromptStreamErrorEvent = {
  type: "error";
  data: {
    message: string;
    code: number;
    data: Record<string, unknown>; // AIConfig;
  };
};

export type RunPromptStreamCallback = (event: RunPromptStreamEvent) => void;

export type RunPromptStreamErrorCallback = (
  event: RunPromptStreamErrorEvent
) => void;

export async function runPrompt(
  serverUrl: string,
  document: vscode.TextDocument,
  payload: {
    promptName: string;
    stream: boolean;
    cancellationToken?: string;
  },
  onStream: RunPromptStreamCallback,
  onError: RunPromptStreamErrorCallback
) {
  console.log("HERE runPrompt");

  // const fetchRes = await ufetch.post(
  //   EDITOR_SERVER_ROUTE_TABLE.RUN_PROMPT(serverUrl),
  //   {
  //     prompt_name: payload.promptName,
  //     stream: payload.stream,
  //     cancellation_token_id: payload.cancellationToken,
  //   }
  // );

  const fetchRes = await fetch(
    EDITOR_SERVER_ROUTE_TABLE.RUN_PROMPT(serverUrl),
    {
      method: "POST",
      body: JSON.stringify({
        prompt_name: payload.promptName,
        stream: payload.stream,
        cancellation_token_id: payload.cancellationToken,
      }),
      headers: new Headers({
        "Content-Type": "application/json;charset=utf-8",
      }),
    }
  );

  // oboe(fetchRes.body)
  //   .node("output_chunk", function (node) {
  //     console.log("HERE output_chunk node=", node);
  //   })
  //   .node("aiconfig", function (node) {
  //     console.log("HERE aiconfig node=", node);
  //   })
  //   .node("aiconfig_complete", function (node) {
  //     console.log("HERE aiconfig_complete node=", node);
  //   })
  //   // .node("!", function (node) {
  //   //   // Emit message with node to the webview
  //   //   console.log("HERE node=", node);
  //   // })
  //   .fail(function (errorReport) {
  //     console.error("Error:", errorReport);
  //   });

  // console.log("HERE runPrompt res=", fetchRes);

  // return fetchRes;

  // TODO: saqadri - handle error cases
  //return res.aiconfig_string;

  const res = await streamingApiChain<{ aiconfig: Record<string, unknown> }>(
    {
      url: EDITOR_SERVER_ROUTE_TABLE.RUN_PROMPT(serverUrl),
      method: "POST",
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,es;q=0.8",
        "cache-control": "no-cache",
        "content-type": "application/json",
        pragma: "no-cache",
        // "sec-ch-ua":
        //   '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
        // "sec-ch-ua-mobile": "?0",
        // "sec-ch-ua-platform": '"macOS"',
        // "sec-fetch-dest": "empty",
        // "sec-fetch-mode": "cors",
        // "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
      },
      body: {
        prompt_name: payload.promptName,
        stream: payload.stream,
        cancellation_token_id: payload.cancellationToken,
      },
    },
    {
      output_chunk: (data) => {
        console.log("HERE output_chunk");
        onStream({
          type: "output_chunk",
          data: data as Record<string, unknown>,
        });
      },
      aiconfig: (data) => {
        console.log("HERE aiconfig");
        onStream({ type: "aiconfig", data: data as Record<string, unknown> });
      },
      aiconfig_complete: (data) => {
        console.log("HERE aiconfig_complete");
        onStream({
          type: "aiconfig_complete",
          data: data as Record<string, unknown>,
        });
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

  console.log("HERE runPrompt res=", res);

  return res;
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

//#region oboe helpers

// Promisify Oboe - similar to this: https://stackoverflow.com/questions/54855494/rewrite-fetch-call-to-oboe-for-json-streams-with-typescript
// Except it allows to use .node('*', fn) & only resolves on done
// See https://medium.com/@amberlamps84/oboe-js-mongodb-express-node-js-and-the-beauty-of-streams-4a90fad5414 on using oboe vs raw streams
// (multiple chunks can be sent in single response & we only want valid json ones)
export async function streamingApi<T>(
  headers: Options,
  on: string = "*",
  fn: (data: unknown) => void,
  on2?: string,
  fn2?: (data: unknown) => void,
  on3?: string,
  fn3?: (data: unknown) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (fn2 && on2 && fn3 && on3) {
      oboe(headers)
        .node(on, fn)
        .node(on2, fn2)
        .node(on3, fn3)
        .done((data) => resolve(data))
        .fail((err) => reject(err.jsonBody));
    } else if (fn2 && on2) {
      oboe(headers)
        .node(on, fn)
        .node(on2, fn2)
        .done((data) => resolve(data))
        .fail((err) => reject(err.jsonBody));
    } else {
      oboe(headers)
        .node(on, fn)
        .done((data) => resolve(data))
        .fail((err) => reject(err.jsonBody));
    }
  });
}

export async function streamingApiChain<T>(
  headers: Options,
  chain: { [on: string]: (data: unknown) => void }
): Promise<T> {
  return new Promise((resolve, reject) => {
    let oboeInstance = oboe(headers);
    Object.keys(chain).forEach((on) => {
      const fn = chain[on];
      oboeInstance = oboeInstance.node(on, fn);
    });

    oboeInstance
      .done((data) => {
        console.log(`streamingApiChain: done: ${data}`);
        resolve(data);
      })
      .fail((err) => {
        console.log(`ERROR: streamingApiChain: ${JSON.stringify(err)}`);
        reject(err.jsonBody);
      });
  });
}

//#endregion
