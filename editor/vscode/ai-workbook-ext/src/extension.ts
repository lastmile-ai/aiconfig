// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { AIConfigEditorProvider } from "./aiConfigEditor";
import { HelloWorldPanel } from "./panels/HelloWorldPanel";
import { exec, spawn } from "child_process";
import path, { resolve } from "path";

const EXTENSION_NAME = "ai-workbook-ext";

const COMMANDS = {
  INIT: `${EXTENSION_NAME}.init`,
  HELLO_WORLD: `${EXTENSION_NAME}.helloWorld`,
  HELLO_WORLD_2: `${EXTENSION_NAME}.helloWorld2`,
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    `Congratulations, your extension ${EXTENSION_NAME} is now active!`
  );

  let setupCommand = vscode.commands.registerCommand(COMMANDS.INIT, () => {
    installDependencies(context);
  });

  // Run the setup command on activation
  vscode.commands.executeCommand(COMMANDS.INIT);

  vscode.window.showInformationMessage("Hello World from ai-workbook-ext!");

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let helloWorldCommand = vscode.commands.registerCommand(
    COMMANDS.HELLO_WORLD,
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from ai-workbook-ext!");
    }
  );

  const cmd = vscode.commands.registerCommand(COMMANDS.HELLO_WORLD_2, () => {
    HelloWorldPanel.render(context.extensionUri);
  });

  // Register our custom editor providers
  context.subscriptions.push(AIConfigEditorProvider.register(context));

  context.subscriptions.push(setupCommand);
  context.subscriptions.push(helloWorldCommand);
  context.subscriptions.push(cmd);
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("And here I am again");
}

async function installDependencies(context: vscode.ExtensionContext) {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Initializing AIConfig Extension",
      cancellable: false,
    },
    async (progress, cancellationToken) => {
      progress.report({
        increment: 0,
        message: "Checking Python installation",
      });

      const isPythonInstalled = await checkPython();
      if (!isPythonInstalled) {
        return;
      }

      progress.report({
        increment: 20,
        message: "Checking pip installation",
      });

      const isPipInstalled = await checkPip();
      if (!isPipInstalled) {
        return;
      }

      progress.report({
        increment: 20,
        message: "Checking dependencies to install or update",
      });

      // Check if requirements need to be installed
      const requirementsInstalled = await checkRequirements(context);
      if (!requirementsInstalled) {
        // Install or update requirements
        progress.report({
          increment: 20,
          message: "Installing dependencies",
        });

        const installationResult = await installRequirements(
          context,
          progress,
          cancellationToken
        );
        if (!installationResult) {
          // The installation encountered issues -- the installRequirements function will have already shown an error message
          return;
        } else {
          // Installation was successful
          progress.report({
            increment: 40,
            message: "Dependencies installed. Let's go!",
          });
        }
      } else {
        // Requirements are already installed
        progress.report({
          increment: 40,
          message: "Dependencies are already installed. Let's go!",
        });
      }
    }
  );
}

async function installRequirements(
  context: vscode.ExtensionContext,
  progress: vscode.Progress<{
    message?: string | undefined;
    increment?: number | undefined;
  }>,
  cancellationToken: vscode.CancellationToken
) {
  const extensionPath = context.extensionPath;
  const requirementsPath = path.join(
    extensionPath,
    "python",
    "requirements.txt"
  );

  return new Promise((resolve, _reject) => {
    const pipInstall = spawn("pip3", [
      "install",
      "-r",
      requirementsPath,
      "--upgrade",
    ]);

    pipInstall.stdout.on("data", (data) => {
      progress.report({
        message: `Installing dependencies: ${data}`,
      });
      console.log(`pip install stdout: ${data}`);
    });

    pipInstall.stderr.on("data", (data) => {
      console.error(`pip install stderr: ${data}`);
    });

    pipInstall.on("close", (code) => {
      if (code !== 0) {
        console.log(`pip install process exited with code ${code}`);
        vscode.window
          .showErrorMessage(
            `Failed to install dependencies. Pip exited with code ${code}. Please try again later`,
            ...["Retry"]
          )
          .then((selection) => {
            if (selection === "Retry") {
              installRequirements(context, progress, cancellationToken);
            }
          });
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function checkRequirements(context: vscode.ExtensionContext) {
  const extensionPath = context.extensionPath;
  const checkRequirementsScriptPath = path.join(
    extensionPath,
    "python",
    "src",
    "check_requirements.py"
  );

  const requirementsPath = path.join(
    extensionPath,
    "python",
    "requirements.txt"
  );

  return new Promise((resolve, reject) => {
    let checkRequirements = spawn("python3", [
      checkRequirementsScriptPath,
      "--requirements_path",
      requirementsPath,
    ]);

    checkRequirements.stdout.on("data", (data) => {
      console.log(`check_requirements.py stdout: ${data}`);
    });

    checkRequirements.on("close", (code) => {
      if (code !== 0) {
        // Need to install requirements
        console.log("Requirements are not installed or out of date");
        resolve(false);
      } else {
        // Requirements are installed
        console.log("Requirements are already installed");
        resolve(true);
      }
    });

    checkRequirements.on("error", (err) => {
      reject(err);
    });
  });
}

async function checkPython() {
  return new Promise((resolve, _reject) => {
    exec("python --version", (error, stdout, stderr) => {
      if (error) {
        console.error("Python was not found, can't install requirements");

        // Guide for installation
        vscode.window
          .showErrorMessage(
            "Python is not installed",
            ...["Install Python", "Retry"]
          )
          .then((selection) => {
            if (selection === "Install Python") {
              vscode.env.openExternal(
                vscode.Uri.parse("https://www.python.org/downloads/")
              );
            } else if (selection === "Retry") {
              vscode.commands.executeCommand(COMMANDS.INIT);
            }
          });
        resolve(false);
      } else {
        resolve(true);
        console.log("Python is installed");
      }
    });
  });
}

async function checkPip() {
  return new Promise((resolve, _reject) => {
    exec("pip --version", (error, stdout, stderr) => {
      if (error) {
        console.log("pip is not found");
        // Guide for installation
        vscode.window
          .showErrorMessage(
            "pip is not installed, but is needed for AIConfig installation",
            ...["Install pip", "Retry"]
          )
          .then((selection) => {
            if (selection === "Install pip") {
              vscode.env.openExternal(
                vscode.Uri.parse("https://pip.pypa.io/en/stable/installation/")
              );
            } else if (selection === "Retry") {
              vscode.commands.executeCommand(COMMANDS.INIT);
            }
          });
        resolve(false);
      } else {
        console.log("pip is installed");
        resolve(true);
      }
    });
  });
}
