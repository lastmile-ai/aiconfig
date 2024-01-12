import { createContext } from "react";
import { WebviewApi } from "vscode-webview";

/**
 * Context for VSCode Webview state and methods.
 */
const WebviewContext = createContext<{
  vscode: WebviewApi<Record<string, any>> | null;
}>({
  vscode: null,
});

export default WebviewContext;