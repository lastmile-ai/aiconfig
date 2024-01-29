import * as vscode from "vscode";
import {
  COMMANDS,
  ServerInfo,
  getDocumentFromServer,
  getNonce,
  initializeServerState,
  runPrompt,
  waitUntilServerReady,
} from "./util";
import { getUri } from "./utilities/getUri";

import * as fs from "fs";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import path from "path";
import { getPortPromise } from "portfinder";

/**
 * Provider for cat scratch editors.
 *
 * Cat scratch editors are used for `.cscratch` files, which are just json files.
 * To get started, run this extension and open an empty `.cscratch` file in VS Code.
 *
 * This provider demonstrates:
 *
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Synchronizing changes between a text document and a custom editor.
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

  private static readonly viewType = "ai-workbook-ext.aiConfigEditor";

  private static readonly scratchCharacters = [
    "😸",
    "😹",
    "😺",
    "😻",
    "😼",
    "😽",
    "😾",
    "🙀",
    "😿",
    "🐱",
  ];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly extensionOutputChannel: vscode.LogOutputChannel
  ) {}

  /**
   * Called when our custom editor is opened.
   *
   *
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    let editorServer: ServerInfo | null = null;

    console.log(this.context.extensionUri);

    console.log(`${document.fileName}: resolveCustomTextEditor called`);

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
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
        // TODO: saqadri - update to main.js once we have a build step
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "..",
          "..",
          "..",
          "python/src/aiconfig/editor/client/build"
        ),
        vscode.Uri.joinPath(this.context.extensionUri, "editor/client/build"),
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
        // console.log(`changeDocumentSubscription, e=${e.document.fileName}`);
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

        case "execute_run": {
          console.log("execute_run event called, payload=", JSON.stringify(e));
          if (!editorServer) {
            // TODO: saqadri - show error message
            console.error(
              "execute_run event called but no aiconfig server running"
            );
            return;
          }

          const promptName: string = e.promptName;
          const stream: boolean = e.stream;
          const cancellationToken: string | null = e.cancellationToken;

          if (!promptName) {
            // TODO: saqadri - show error message
            console.error("execute_run event called with empty promptName");
            return;
          }

          // Notify the webview that we are starting to run the prompt
          webviewPanel.webview.postMessage({
            type: "on_run_start",
            promptName,
          });

          // Run the prompt
          const result = await runPrompt(
            editorServer.url,
            document,
            { promptName, stream, cancellationToken },
            /*onStream*/ (data) => {
              console.log("onStream called with data=", data);
              webviewPanel.webview.postMessage({
                type: "on_run_stream_update",
                promptName,
                data,
              });
            },
            /*onError*/ (error) => {
              console.log("onStream called with data=", error);
              webviewPanel.webview.postMessage({
                type: "on_run_stream_error",
                promptName,
                error,
              });
            }
          );

          console.log("DID I EVER GET HERE?");

          // Notify the webview of the result of running the prompt
          webviewPanel.webview.postMessage({
            type: "on_run_complete",
            promptName,
            result,
          });

          break;
        }

        case "add":
          console.log("Adding new scratch!");
          //this.addNewScratch(document);
          return;

        case "delete":
          console.log("Deleting new scratch!");
          //this.deleteScratch(document, e.id);
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

  private async startEditorServer(
    document: vscode.TextDocument
  ): Promise<ServerInfo> {
    this.extensionOutputChannel.info(
      this.prependMessage("Starting editor server", document)
    );

    const extensionPath = this.context.extensionPath;
    const startServerScriptPath = path.join(
      extensionPath,
      "python",
      "src",
      "start_server.py"
    );

    const openPort = await getPortPromise();

    // TODO: saqadri - specify parsers_module_path
    let startServer = spawn("python3", [
      startServerScriptPath,
      "start",
      "--server-port",
      openPort.toString(),
    ]);

    startServer.stdout.on("data", (data) => {
      this.extensionOutputChannel.info(this.prependMessage(data, document));
      console.log(`server stdout: ${data}`);
    });

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
  private getHtmlForWebview(
    webview: vscode.Webview,
    editorServer: ServerInfo
  ): string {
    // Local path to script and css for the webview
    // const scriptUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(this.context.extensionUri, "media", "catScratch.js")
    // );

    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "reset.css")
    );

    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "vscode.css")
    );

    // The CSS file from the React build output
    const stylesUri = getUri(
      webview,
      this.context.extensionUri,
      "webview-ui",
      "build",
      "static",
      "css",
      "main.css"
    );

    // /Users/saqadri/lm/aiconfig/python/src/aiconfig/editor/client/build/static/js/main.js

    // The JS file from the React build output
    const scriptUri = getUri(
      webview,
      this.context.extensionUri,
      "..",
      "..",
      "..",
      "python",
      "src",
      "aiconfig",
      "editor",
      "client",
      "build",
      "static",
      "js",
      "main.js"
    );

    const scriptUri2 = getUri(
      webview,
      this.context.extensionUri,
      "editor",
      "client",
      "build",
      "static",
      "js",
      "main.js"
    );

    console.log(`exists(${scriptUri.path}) = ${fs.existsSync(scriptUri.path)}`);
    console.log(
      `exists(${scriptUri2.path}) = ${fs.existsSync(scriptUri2.path)}`
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
     <link href="${styleResetUri}" rel="stylesheet" />
		 <link href="${styleVSCodeUri}" rel="stylesheet" />
		 <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: http: https: 'self'; connect-src vscode-webview: ${editorServer.url} http: https:; style-src 'unsafe-inline' ${webview.cspSource} https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0 https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs/editor/editor.main.css; script-src 'nonce-${nonce}' vscode-resource: https: http: https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0 https://cdn.jsdelivr.net; font-src https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs/base/browser/ui/codicons/codicon/codicon.ttf; worker-src blob:;">
		 <title>Hello World</title>
	   </head>
	   <body>
		 <noscript>You need to enable JavaScript to run this app.</noscript>
		 <div id="root"></div>
		 <script nonce="${nonce}" src="${scriptUri}"></script>
	   </body>
	 </html>
   `;

    // return /* html */ `
    // 		<!DOCTYPE html>
    // 		<html lang="en">
    // 		<head>
    // 			<meta charset="UTF-8">

    // 			<!--
    // 			Use a content security policy to only allow loading images from https or from our extension directory,
    // 			and only allow scripts that have a specific nonce.
    // 			-->
    // 			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

    // 			<meta name="viewport" content="width=device-width, initial-scale=1.0">

    // 			<link href="${styleResetUri}" rel="stylesheet" />
    // 			<link href="${styleVSCodeUri}" rel="stylesheet" />
    // 			<link href="${styleMainUri}" rel="stylesheet" />

    // 			<title>Cat Scratch</title>
    // 		</head>
    // 		<body>
    // 			<div class="notes">
    // 				<div class="add-button">
    // 					<button>Scratch!</button>
    // 				</div>
    // 				<div class="open-raw-button">
    // 					<button>Open Raw</button>
    // 				</div>
    // 			</div>

    // 			<script nonce="${nonce}" src="${scriptUri}"></script>
    // 		</body>
    // 		</html>`;
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

  /**
   * Add a new scratch to the current document.
   * @command:workbench.action.reopenTextEditor
   */
  private addNewScratch(document: vscode.TextDocument) {
    const json = this.getDocumentAsJson(document);
    const character =
      AIConfigEditorProvider.scratchCharacters[
        Math.floor(
          Math.random() * AIConfigEditorProvider.scratchCharacters.length
        )
      ];
    json.scratches = [
      ...(Array.isArray(json.scratches) ? json.scratches : []),
      {
        id: getNonce(),
        text: character,
        created: Date.now(),
      },
    ];

    return this.updateTextDocumentJson(document, json);
  }

  /**
   * Delete an existing scratch from a document.
   */
  private deleteScratch(document: vscode.TextDocument, id: string) {
    const json = this.getDocumentAsJson(document);
    if (!Array.isArray(json.scratches)) {
      return;
    }

    json.scratches = json.scratches.filter((note: any) => note.id !== id);

    return this.updateTextDocumentJson(document, json);
  }

  /**
   * Try to get a current document as json text.
   */
  private getDocumentAsJson(document: vscode.TextDocument): any {
    const text = document.getText();
    if (text.trim().length === 0) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        "Could not get document as json. Content is not valid json"
      );
    }
  }

  /**
   * Write out the json to a given document.
   */
  private updateTextDocumentJson(document: vscode.TextDocument, json: any) {
    const edit = new vscode.WorkspaceEdit();

    // Just replace the entire document every time for this example extension.
    // A more complete extension should compute minimal edits instead.
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      JSON.stringify(json, null, 2)
    );

    return vscode.workspace.applyEdit(edit);
  }
}
