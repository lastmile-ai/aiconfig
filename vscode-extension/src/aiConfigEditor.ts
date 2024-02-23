import * as vscode from "vscode";
import {
  COMMANDS,
  EXTENSION_NAME,
  ServerInfo,
  getCurrentWorkingDirectory,
  getDocumentFromServer,
  setupEnvironmentVariables,
  updateServerState,
  updateWebviewEditorThemeMode,
  waitUntilServerReady,
} from "./util";
import {
  getPythonPath,
  initializePythonFlow,
} from "./utilities/pythonSetupUtils";
import { getNonce } from "./utilities/getNonce";
import { getUri } from "./utilities/getUri";

import { spawn } from "child_process";
import { getPortPromise } from "portfinder";
import {
  AIConfigEditorManager,
  AIConfigEditorState,
} from "./aiConfigEditorManager";

/**
 * Provider for AIConfig editors.
 *
 * AIConfig editors are used for `.aiconfig`, `.aiconfig.json` and `.aiconfig.yaml` files.
 * These files are backed by a JSON schema under the hood.
 */
export class AIConfigEditorProvider implements vscode.CustomTextEditorProvider {
  public static register(
    context: vscode.ExtensionContext,
    extensionOutputChannel: vscode.LogOutputChannel,
    aiconfigEditorManager: AIConfigEditorManager
  ): vscode.Disposable {
    const provider = new AIConfigEditorProvider(
      context,
      extensionOutputChannel,
      aiconfigEditorManager
    );
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      AIConfigEditorProvider.viewType,
      provider
    );
    return providerRegistration;
  }

  public static readonly viewType = `${EXTENSION_NAME}.aiConfigEditor`;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly extensionOutputChannel: vscode.LogOutputChannel,
    private readonly aiconfigEditorManager: AIConfigEditorManager
  ) {}

  /**
   * Called when our custom editor is opened.
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    let editorServer: ServerInfo | null = null;
    let isWebviewDisposed = false;

    // TODO: saqadri - clean up console log
    //console.log(`${document.fileName}: resolveCustomTextEditor called`);

    // We show the extension output channel so users can see some of the server logs as they use the extension
    this.extensionOutputChannel.show(/*preserveFocus*/ true);

    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "out"),

        // editor/build/static/js contains the main.js bundle for the editor.
        vscode.Uri.joinPath(this.context.extensionUri, "editor", "build"),
        vscode.Uri.joinPath(this.context.extensionUri, "editor", "static"),
      ],
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    function updateWebview() {
      if (isWebviewDisposed) {
        console.warn("Skipping webview update -- it's disposed.");
        return;
      }

      webviewPanel.webview.postMessage({
        type: "update",
        text: document.getText(),
      });
    }

    // Update webview immediately so we unblock the render; server init will happen in the background.
    updateWebview();

    // Do not start the server until we ensure the Python setup is ready
    await initializePythonFlow(this.context, this.extensionOutputChannel);

    // Start the AIConfig editor server process. Don't await at the top level here since that blocks the
    // webview render (which happens only when resolveCustomTextEditor returns)
    this.startEditorServer(document).then(async (startedServer) => {
      editorServer = startedServer;

      this.aiconfigEditorManager.addEditor(
        new AIConfigEditorState(
          document,
          webviewPanel,
          startedServer,
          this.aiconfigEditorManager
        )
      );

      // Wait for server ready
      await waitUntilServerReady(startedServer.url);

      // Now set up the server with the latest document content
      await this.startServerWithRetry(
        startedServer.url,
        document,
        webviewPanel
      );

      // Inform the webview of the server URL
      if (!isWebviewDisposed) {
        webviewPanel.webview.postMessage({
          type: "set_server_url",
          url: startedServer.url,
        });
      }
    });

    // Hook up event handlers so that we can synchronize the webview with the text document.
    //
    // The text document acts as our model, so we have to sync change in the document to our
    // editor and sync changes in the editor back to the document.
    //
    // Remember that a single text document can also be shared between multiple custom
    // editors (this happens for example when you split a custom editor)

    // We use this flag to track if a change to the document is coming from the webview.
    // This is because we need to ignore these changes to avoid an infinite loop in onDidChangeTextDocument
    // For more details, see https://code.visualstudio.com/api/extension-guides/custom-editors#synchronizing-changes-with-the-textdocument
    let isInternalDocumentChange = false;

    function updateServerWithRetry(
      serverUrl: string,
      document: vscode.TextDocument
    ) {
      updateServerState(serverUrl, document)
        .then(() => {
          // In case of previous failure, reset to editable state
          webviewPanel.webview.postMessage({
            type: "set_readonly_state",
            isReadOnly: false,
          });
        })
        .catch((e) => {
          if (isWebviewDisposed) {
            // Ignore errors caused by closing the webview while the server update
            // request is in flight (e.g. closing config w/ unsaved changes will
            // emit onDidChangeTextDocument with reverted unsaved changes)
            // See #1201 for full details.
            console.info(
              "Ignoring server update error due to webview disposal"
            );
            return;
          }

          webviewPanel.webview.postMessage({
            type: "set_readonly_state",
            isReadOnly: true,
          });

          vscode.window
            .showErrorMessage(
              "Failed to update aiconfig server. You can view the aiconfig but cannot modify it.",
              ...["Details", "Retry"]
            )
            .then((selection) => {
              if (selection === "Details") {
                this.extensionOutputChannel.error(
                  e?.message ?? JSON.stringify(e)
                );
                this.extensionOutputChannel.show(/*preserveFocus*/ true);
              }

              if (selection === "Retry") {
                updateServerWithRetry(serverUrl, document);
              }
            });
        });
    }

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      async (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          if (isInternalDocumentChange) {
            console.log(
              `changeDocumentSubscription ${e.document.uri} - skipping event because it was triggered by the webview`
            );

            // Reset the internal document change flag
            isInternalDocumentChange = false;
            return;
          }

          if (isWebviewDisposed) {
            console.warn(
              `changeDocumentSubscription ${e.document.uri} - skipping event because webview has been disposed`
            );
            return;
          }

          if (e.contentChanges.length === 0) {
            console.log(
              `changeDocumentSubscription ${e.document.uri} - skipping event because there are no content changes`
            );
            return;
          }

          // TODO: saqadri - instead of sending the entire document to the webview,
          // can ask it to reload the document from the server

          // Update webview immediately, and server state should be updated in the background.
          console.log(
            `changeDocumentSubscription ${e.document.uri} -- updating webview`
          );
          updateWebview();

          // Notify server of updated document
          if (editorServer) {
            await updateServerWithRetry(editorServer.url, e.document);
          }
        }
      }
    );

    const willSaveDocumentSubscription =
      vscode.workspace.onWillSaveTextDocument((e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          console.log(`${e.document.fileName}: willSaveDocument`);

          // Get the latest document state from the server before saving to disk
          e.waitUntil(
            new Promise((resolve, _reject) => {
              console.log(`willSaveDocument - inside promise`);
              if (!editorServer) {
                // TODO: saqadri - show error message
                return [];
              }

              getDocumentFromServer(editorServer.url, e.document).then(
                (newDocumentText) => {
                  console.log(
                    `${e.document.fileName}: willSaveDocument - creating textedit`
                  );
                  resolve([
                    vscode.TextEdit.replace(
                      new vscode.Range(0, 0, e.document.lineCount, 0),
                      newDocumentText
                    ),
                  ]);
                }
              );
            })
          );
        }
      });

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      isWebviewDisposed = true;
      console.log(`${document.fileName}: Webview disposed`);

      changeDocumentSubscription.dispose();
      willSaveDocumentSubscription.dispose();

      if (editorServer) {
        console.log("Killing editor server process");
        editorServer.proc.kill();
        editorServer = null;
      }
    });

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage(async (e) => {
      const command = e.command;
      const text = e.text;

      switch (command) {
        case "hello":
          // Code that should run in response to the hello message command
          vscode.window.showInformationMessage(text);
          return;
        // Add more switch case statements here as more webview message commands
        // are created within the webview context (i.e. inside media/main.js)
      }

      switch (e.type) {
        case "document_changed":
          // If the webview tells us that the document has changed,
          // then get the latest document state from the server
          console.log("document_changed event called");

          if (!editorServer) {
            // TODO: saqadri - show error message
            return;
          }

          const newDocumentText = await getDocumentFromServer(
            editorServer.url,
            document
          );

          isInternalDocumentChange = true;
          console.log(
            `pre- isInternalDocumentChange=${isInternalDocumentChange}`
          );
          this.updateTextDocument(document, newDocumentText);

          return;

        case "open_in_text_editor":
          vscode.commands.executeCommand("workbench.action.reopenTextEditor");
          return;

        case "show_notification":
          const notification = e.notification as {
            // AIConfigEditorNotification
            title: string;
            message: string | null;
            type?: "info" | "success" | "warning" | "error";
            autoClose?: boolean | number;
            onClose?: () => void;
            onOpen?: () => void;
          };

          let notificationFn;
          let outputChannelFn;
          switch (notification.type) {
            case "info":
            case "success":
              notificationFn = vscode.window.showInformationMessage;
              outputChannelFn = this.extensionOutputChannel.info;
              break;
            case "warning":
              notificationFn = vscode.window.showWarningMessage;
              outputChannelFn = this.extensionOutputChannel.warn;
              break;
            case "error":
              notificationFn = vscode.window.showErrorMessage;
              outputChannelFn = this.extensionOutputChannel.error;
              break;
            default:
              notificationFn = vscode.window.showInformationMessage;
              outputChannelFn = this.extensionOutputChannel.info;
          }

          const message = notification.message;

          let notificationAction;
          // TODO: Create a constant value somewhere in lastmile-utils to
          // centralize string error message for missing API key. This
          // logic is defined in https://github.com/lastmile-ai/aiconfig/blob/33fb852854d0bd64b8ddb4e52320112782008b99/python/src/aiconfig/util/config_utils.py#L41
          if (message?.includes("Missing API key")) {
            // TODO: Once VS Code supports Markdown in diagnostic links, add
            // support to link to our docs: https://github.com/lastmile-ai/aiconfig/pull/1300/files#r1499920802
            notificationAction = await notificationFn(
              "Looks like you're missing an API key, please set it in your .env variables",
              "Set API Keys"
            );
          } else {
            const buttonOptions = message ? ["Details"] : [];
            // Notification supports 'details' for modal only. For now, just show title
            // in notification toast and full message in output channel.
            notificationAction = await notificationFn(
              notification.title,
              ...buttonOptions
            );
          }

          if (message) {
            outputChannelFn(
              this.prependMessage(
                `${notification.title} \n ${message}`,
                document
              )
            );
            if (notificationAction === "Set API Keys") {
              await setupEnvironmentVariables(this.context);
            } else if (notificationAction === "Details") {
              // If user clicked "Details", show & focus the output channel
              this.extensionOutputChannel.show(/*preserveFocus*/ true);
            }
          }

          notification.onClose?.();
      }
    });

    // Set initial dark/light theme mode for the webview and on theme changes. Also, on tab activation.
    if (!isWebviewDisposed) {
      updateWebviewEditorThemeMode(webviewPanel.webview);

      vscode.window.onDidChangeActiveColorTheme(() => {
        if (!isWebviewDisposed) {
          updateWebviewEditorThemeMode(webviewPanel.webview);
        }
      });

      webviewPanel.onDidChangeViewState((e) => {
        if (e.webviewPanel.active) {
          if (!isWebviewDisposed) {
            updateWebviewEditorThemeMode(webviewPanel.webview);
          }
        }
      });
    }
  }

  private startServerWithRetry(
    serverUrl: string,
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ) {
    updateServerState(serverUrl, document)
      .then(() => {
        // In case of previous failure, reset to editable state
        webviewPanel.webview.postMessage({
          type: "set_readonly_state",
          isReadOnly: false,
        });
      })
      .catch((e) => {
        webviewPanel.webview.postMessage({
          type: "set_readonly_state",
          isReadOnly: true,
        });

        vscode.window
          .showErrorMessage(
            "Failed to start aiconfig server. You can view the aiconfig but cannot modify it.",
            ...["Details", "Retry"]
          )
          .then((selection) => {
            if (selection === "Details") {
              this.extensionOutputChannel.error(
                e?.message ?? JSON.stringify(e)
              );
              this.extensionOutputChannel.show(/*preserveFocus*/ true);
            }

            if (selection === "Retry") {
              this.startServerWithRetry(serverUrl, document, webviewPanel);
            }
          });
      });
  }

  private prependMessage(message: string, document: vscode.TextDocument) {
    return `${document.fileName}: ${message}`;
  }

  private async startEditorServer(
    document: vscode.TextDocument
  ): Promise<ServerInfo> {
    this.extensionOutputChannel.info(
      this.prependMessage("Starting editor server", document)
    );

    // If there is a custom model registry path, pass it to the server
    let config = vscode.workspace.getConfiguration(EXTENSION_NAME);
    let modelRegistryPath = config.get<string>("modelRegistryPath");
    const modelRegistryPathArgs = modelRegistryPath
      ? ["--parsers-module-path", modelRegistryPath]
      : [];

    const openPort = await getPortPromise();

    const pythonPath = await getPythonPath();

    // TODO: saqadri - specify parsers_module_path
    // `aiconfig` command not useable here because it relies on python. Instead invoke the module directly.
    let startServer = spawn(
      pythonPath,
      [
        "-m",
        "aiconfig.scripts.aiconfig_cli",
        "start",
        "--server-port",
        openPort.toString(),
        ...modelRegistryPathArgs,
      ],
      {
        cwd: getCurrentWorkingDirectory(document),
      }
    );

    startServer.stdout.on("data", (data) => {
      this.extensionOutputChannel.info(this.prependMessage(data, document));
      console.log(`server stdout: ${data}`);
    });

    // TODO: saqadri - stderr is very noisy for some reason (duplicating INFO logs). Figure out why before enabling this.
    startServer.stderr.on("data", (data) => {
      this.extensionOutputChannel.error(this.prependMessage(data, document));
      console.error(`server stderr: ${data}`);
    });

    startServer.on("spawn", () => {
      this.extensionOutputChannel.info(
        this.prependMessage(
          `Started server at port=${openPort}, pid=${startServer.pid}`,
          document
        )
      );
      console.log(`server spawned: ${startServer.pid}`);
    });

    startServer.on("close", (code) => {
      if (code !== 0) {
        this.extensionOutputChannel.error(
          this.prependMessage(
            `Server at port=${openPort}, pid=${startServer.pid} was terminated unexpectedly with exit code ${code}`,
            document
          )
        );
        console.error(`server terminated unexpectedly: exit code=${code}`);
      } else {
        this.extensionOutputChannel.info(
          this.prependMessage(
            `Server at port=${openPort}, pid=${startServer.pid} was terminated successfully.`,
            document
          )
        );
        console.log(`server terminated successfully`);
      }
    });

    startServer.on("error", (err) => {
      this.extensionOutputChannel.error(
        this.prependMessage(JSON.stringify(err), document)
      );
      // TODO: saqadri - add "restart" option with error message
    });

    const serverUrl = `http://localhost:${openPort}`;

    return {
      proc: startServer,
      url: serverUrl,
    };
  }

  /**
   * Get the static html used for the editor webviews.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    // The JS file from the React build output
    const scriptUri = getUri(
      webview,
      this.context.extensionUri,
      "editor",
      "build",
      "static",
      "js",
      "main.js"
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
	 <!DOCTYPE html>
	 <html lang="en">
	   <head>
		 <meta charset="utf-8">
		 <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
		 <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: http: https: 'self'; media-src data: http: https: 'self'; connect-src vscode-webview: http://localhost:* http: https:; style-src 'unsafe-inline' ${webview.cspSource} https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0 https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs/editor/editor.main.css; script-src 'nonce-${nonce}' vscode-resource: https: http: https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0 https://cdn.jsdelivr.net; font-src https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs/base/browser/ui/codicons/codicon/codicon.ttf; worker-src blob:;">
		 </head>
	   <body>
		 <noscript>You need to enable JavaScript to run this app.</noscript>
		 <div id="root"></div>
		 <script nonce="${nonce}" src="${scriptUri}"></script>
	   </body>
	 </html>
   `;
  }

  /**
   * Replaces the entire existing document with the provided new text.
   */
  private updateTextDocument(document: vscode.TextDocument, newText: string) {
    const edit = new vscode.WorkspaceEdit();

    // TODO: saqadri - figure out a way to update the document piecemeal
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      newText
    );

    return vscode.workspace.applyEdit(edit);
  }
}
