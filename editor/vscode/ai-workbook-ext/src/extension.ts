// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { CatScratchEditorProvider } from "./aiConfigEditor";
import { HelloWorldPanel } from "./panels/HelloWorldPanel";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "ai-workbook-ext" is now active!'
  );

  vscode.window.showInformationMessage("Hello World from ai-workbook-ext!");

  console.log("Is this getting hit?");

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "ai-workbook-ext.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from ai-workbook-ext!");
    }
  );

  const cmd = vscode.commands.registerCommand(
    "ai-workbook-ext.helloWorld2",
    () => {
      HelloWorldPanel.render(context.extensionUri);
    }
  );

  // Register our custom editor providers
  context.subscriptions.push(CatScratchEditorProvider.register(context));

  context.subscriptions.push(disposable);
  context.subscriptions.push(cmd);
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("And here I am again");
}
