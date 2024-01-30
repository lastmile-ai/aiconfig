import * as vscode from "vscode";
import {
  COMMANDS,
  EXTENSION_NAME,
  ServerInfo,
  getDocumentFromServer,
  initializeServerState,
  waitUntilServerReady,
} from "./util";
import { getNonce } from "./utilities/getNonce";
import { getUri } from "./utilities/getUri";

import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import { spawn } from "child_process";
import path from "path";
import { getPortPromise } from "portfinder";

/**
 * Provider for AIConfig editors.
 *
 * AIConfig editors are used for `.aiconfig`, `.aiconfig.json` and `.aiconfig.yaml` files.
 * These files are backed by a JSON schema under the hood.
 */
export class AIConfigEditorProvider implements vscode.CustomTextEditorProvider {
  public static register(
    context: vscode.ExtensionContext,
    extensionOutputChannel: vscode.LogOutputChannel
  ): vscode.Disposable {
    const provider = new AIConfigEditorProvider(
      context,
      extensionOutputChannel
    );
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      AIConfigEditorProvider.viewType,
      provider
    );
    return providerRegistration;
  }

  private static readonly viewType = `${EXTENSION_NAME}.aiConfigEditor`;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly extensionOutputChannel: vscode.LogOutputChannel
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

    // TODO: saqadri - clean up console log
    //console.log(`${document.fileName}: resolveCustomTextEditor called`);

    // We show the extension output channel so users can see some of the server logs as they use the extension
    this.extensionOutputChannel.show(/*preserveFocus*/ true);

    // Start the AIConfig editor server process.
    editorServer = await this.startEditorServer(document);

    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "out"),

        // editor/build/static/js contains the main.js bundle for the editor.
        vscode.Uri.joinPath(this.context.extensionUri, "editor", "build"),
      ],
    };
    webviewPanel.webview.html = this.getHtmlForWebview(
      webviewPanel.webview,
      editorServer
    );

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

    let isWebviewDisposed = false;

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

          // Notify server of updated document
          if (editorServer) {
            console.log("changeDocumentSubscription -- updating server");

            // TODO: saqadri - decide if we want to await here or just fire and forget
            await initializeServerState(editorServer.url, e.document);
          }

          console.log(
            `changeDocumentSubscription ${e.document.uri} -- updating webview`
          );

          // TODO: saqadri - instead of sending the entire document to the webview,
          // can ask it to reload the document from the server

          // TODO: saqadri - we are waiting too long to update the webview. This should happen immediately, and server state should be updated in the background.
          updateWebview();
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
      console.log(`${document.fileName}: Webview disposed`);
      changeDocumentSubscription.dispose();
      willSaveDocumentSubscription.dispose();

      // TODO: saqadri -- terminate the editor server process.
      if (editorServer) {
        console.log("Killing editor server process");
        editorServer.proc.kill();
      }

      isWebviewDisposed = true;
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

        case "open-raw":
          vscode.commands.executeCommand("workbench.action.reopenTextEditor");
      }
    });

    // Wait for server ready
    await waitUntilServerReady(editorServer.url);

    // Now set up the server with the latest document content
    await initializeServerState(editorServer.url, document);

    // Inform the webview of the server URL
    if (!isWebviewDisposed) {
      webviewPanel.webview.postMessage({
        type: "set_server_url",
        url: editorServer.url,
      });
    }

    updateWebview();
  }

  private prependMessage(message: string, document: vscode.TextDocument) {
    return `${document.fileName}: ${message}`;
  }

  private getCurrentWorkingDirectory(document: vscode.TextDocument) {
    let cwd: string = null;
    if (document != null && !document.isUntitled) {
      // Ideally we use the directory of the current document
      cwd = path.dirname(document.fileName);
    } else if (vscode.workspace.workspaceFolders != null) {
      // If there is no active document, use the workspace path
      cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
    } else {
      // If there is no active document and no workspace, use a temp directory
      let tempDir = os.tmpdir();
      let subDir = "vscode-aiconfig-" + crypto.randomBytes(6).toString("hex");
      cwd = path.join(tempDir, subDir);
      if (!fs.existsSync(cwd)) {
        fs.mkdirSync(cwd);
      }
    }

    return cwd;
  }

  private async startEditorServer(
    document: vscode.TextDocument
  ): Promise<ServerInfo> {
    this.extensionOutputChannel.info(
      this.prependMessage("Starting editor server", document)
    );

    const openPort = await getPortPromise();

    // TODO: saqadri - specify parsers_module_path
    let startServer = spawn(
      "aiconfig",
      ["start", "--server-port", openPort.toString()],
      {
        cwd: this.getCurrentWorkingDirectory(document),
      }
    );

    startServer.stdout.on("data", (data) => {
      this.extensionOutputChannel.info(this.prependMessage(data, document));
      console.log(`server stdout: ${data}`);
    });

    // TODO: saqadri - stderr is very noisy for some reason (duplicating INFO logs). Figure out why before enabling this.
    // startServer.stderr.on("data", (data) => {
    //   this.extensionOutputChannel.error(this.prependMessage(data, document));
    //   console.error(`server stderr: ${data}`);
    // });

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
  private getHtmlForWebview(
    webview: vscode.Webview,
    editorServer: ServerInfo
  ): string {
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
		 <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: http: https: 'self'; connect-src vscode-webview: ${editorServer.url} http: https:; style-src 'unsafe-inline' ${webview.cspSource} https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0 https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs/editor/editor.main.css; script-src 'nonce-${nonce}' vscode-resource: https: http: https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0 https://cdn.jsdelivr.net; font-src https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs/base/browser/ui/codicons/codicon/codicon.ttf; worker-src blob:;">
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
