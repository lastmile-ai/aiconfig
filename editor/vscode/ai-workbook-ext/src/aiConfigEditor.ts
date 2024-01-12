import * as vscode from "vscode";
import { getNonce } from "./util";
import { getUri } from "./utilities/getUri";

import * as fs from "fs";

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
export class CatScratchEditorProvider
  implements vscode.CustomTextEditorProvider
{
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new CatScratchEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      CatScratchEditorProvider.viewType,
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

  constructor(private readonly context: vscode.ExtensionContext) {}

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
    console.log(this.context.extensionUri);
    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "out"),
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "..",
          "..",
          "..",
          "python/src/aiconfig/editor/client/build"
        ),
        vscode.Uri.joinPath(this.context.extensionUri, "webview-ui/build"),
        vscode.Uri.joinPath(this.context.extensionUri, "editor/client/build"),
      ],
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    function updateWebview() {
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

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          updateWebview();
        }
      }
    );

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage((e) => {
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
        case "add":
          this.addNewScratch(document);
          return;

        case "delete":
          this.deleteScratch(document, e.id);
          return;
        case "open-raw":
          vscode.commands.executeCommand("workbench.action.reopenTextEditor");
      }
    });

    updateWebview();
  }

  /**
   * Get the static html used for the editor webviews.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    // Local path to script and css for the webview
    // const scriptUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(this.context.extensionUri, "media", "catScratch.js")
    // );

    // const styleResetUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(this.context.extensionUri, "media", "reset.css")
    // );

    // const styleVSCodeUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(this.context.extensionUri, "media", "vscode.css")
    // );

    // const styleMainUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(this.context.extensionUri, "media", "catScratch.css")
    // );

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
      "webview-ui",
      "build",
      "static",
      "js",
      "main.js"
    );

    const scriptUri3 = getUri(
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
      `exists(${scriptUri3.path}) = ${fs.existsSync(scriptUri3.path)}`
    );

    console.log("path to script is", scriptUri3);
    console.log("cspSource is", webview.cspSource);

    // vscode.Uri.(
    // /Users/saqadri/lm/aiconfig/python/src/aiconfig/editor
    //   "/Users/saqadri/lm/aiconfig/python/src/aiconfig/editor/client/build/static/js/main.js"
    // ),

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    console.log("nonce is", nonce);

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
	 <!DOCTYPE html>
	 <html lang="en">
	   <head>
		 <meta charset="utf-8">
		 <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
		 <meta name="theme-color" content="#000000">
		 <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src vscode-webview: http://localhost:8080; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
     <link rel="stylesheet" type="text/css" href="${stylesUri}">
		 <title>Hello World</title>
	   </head>
	   <body>
		 <noscript>You need to enable JavaScript to run this app.</noscript>
		 <div id="root"></div>
		 <script nonce="${nonce}" src="${scriptUri3}"></script>
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
   * Add a new scratch to the current document.
   * @command:workbench.action.reopenTextEditor
   */
  private addNewScratch(document: vscode.TextDocument) {
    const json = this.getDocumentAsJson(document);
    const character =
      CatScratchEditorProvider.scratchCharacters[
        Math.floor(
          Math.random() * CatScratchEditorProvider.scratchCharacters.length
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

    return this.updateTextDocument(document, json);
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

    return this.updateTextDocument(document, json);
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
  private updateTextDocument(document: vscode.TextDocument, json: any) {
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
