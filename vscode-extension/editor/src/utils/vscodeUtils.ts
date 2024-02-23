import { WebviewApi } from "vscode-webview";
import type { AIConfig, JSONValue } from "aiconfig";

/**
 * State that gets serialized and restored when the webview is recreated.
 * This is important because vscode controls the webview lifecycle and
 * will dehydrate the webview when it is inactive.
 * We can store anything we want in there, and we use this type to define what we store.
 * For more information, see https://code.visualstudio.com/api/extension-guides/webview#getstate-and-setstate
 */
export type WebviewState = {
  aiconfigState?: AIConfig;
  isReadOnly?: boolean;
  serverUrl?: string;
  theme?: "light" | "dark";
};

/**
 * Syntactic sugar for getting the webview state as @see WebviewState.
 */
export function getWebviewState(
  vscode: WebviewApi<Record<string, unknown>> | null
) {
  return vscode?.getState() as WebviewState | null;
}

/**
 * Syntactic sugar for setting the webview state as @see WebviewState.
 */
export function setWebviewState(
  vscode: WebviewApi<Record<string, unknown>> | null,
  webviewState: WebviewState
) {
  if (vscode) {
    return vscode?.setState(webviewState);
  } else {
    // TODO: saqadri - leaving as best effort for now
    console.error(`Unable to save webview state -- vscode API is unavailable`);
  }
}

/**
 * Syntactic sugar for updating the webview state as @see WebviewState.
 * This function gets the existing webview state, and applies the provided partial state as updates.
 */
export function updateWebviewState(
  vscode: WebviewApi<Record<string, unknown>> | null,
  webviewState: Partial<WebviewState>
) {
  if (vscode) {
    const existingState = vscode.getState() as WebviewState | null;
    const updatedState: WebviewState = {
      ...(existingState || {}),
      ...webviewState,
    };

    return vscode?.setState(updatedState);
  } else {
    // TODO: saqadri - leaving as best effort for now
    console.error(`Unable to save webview state -- vscode API is unavailable`);
  }
}

//#region Messages from Webview -> VSCode

// Add more message types here as needed
export type WebviewMessage =
  | {
      type: string;
      content?: JSONValue;
    }
  | NotifyDocumentDirtyMessage
  | ExecuteRunMessage;

/**
 * Notification message to extension host informing it that the document has been modified in the webview.
 */
export type NotifyDocumentDirtyMessage = {
  type: "document_changed";
};

/**
 * Message to extension host requesting that it execute the given prompt.
 */
export type ExecuteRunMessage = {
  type: "execute_run";
  promptName: string;
  stream: boolean;
  cancellationToken?: string;
};

export function sendMessage<T extends WebviewMessage>(
  vscode: WebviewApi<Record<string, unknown>>,
  message: T
) {
  return vscode.postMessage(message);
}

export function notifyDocumentDirty(
  vscode: WebviewApi<Record<string, unknown>>
) {
  return sendMessage(vscode, { type: "document_changed" });
}

//#endregion
