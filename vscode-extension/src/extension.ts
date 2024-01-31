
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import * as AWS from 'aws-sdk';
import { exec, spawn } from "child_process";
import {readFileSync} from 'fs';
import path from "path";
import { ufetch } from "ufetch";
import { EXTENSION_NAME, COMMANDS } from "./util";
import { AIConfigEditorProvider } from "./aiConfigEditor";

const LASTMILE_BASE_URI: string = "https://lastmileai.dev/"

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    `Congratulations, your extension ${EXTENSION_NAME} is now active!`
  );

  // Create an output channel for the extension
  const extensionOutputChannel = vscode.window.createOutputChannel("AIConfig", {
    log: true,
  });

  let setupCommand = vscode.commands.registerCommand(COMMANDS.INIT, () => {
    installDependencies(context, extensionOutputChannel);
  });
  context.subscriptions.push(setupCommand);

  let shareCommand = vscode.commands.registerCommand(COMMANDS.SHARE, async () => {
    // TODO: use vscode.window.activeTextEditor instead of hardcoding
    const fileName: string = "/Users/rossdancraig/Projects/aiconfig/cookbooks/Gemini/gemini_demo.aiconfig.json";
    const sanitizedFileName: string = sanitizeFileName(fileName);

    // Use empty accessKeyId and secretAccessKey so bucket can be accessed publicly
    AWS.config.update({
      accessKeyId: '',
      secretAccessKey: '',
    });
    const s3 = new AWS.S3();

    const randomPath = Math.round(Math.random() * 10000);
    const bucket: string = "lastmileai.aiconfig.public";
    const uploadKey: string = `aiconfigs/${getTodayDateString()}/${randomPath}/${sanitizedFileName}`;
    const configString = readFileSync(fileName, 'utf-8');
    // TODO: Will also need to check for yaml files and change the contentType accordingly
    const contentType = "application/json";

    const input = {
      ACL: 'public-read',
      ContentType: contentType,
      // TODO: Check if we can just pass in fileName itself? Don't think so
      Body: configString, 
      Bucket: bucket,
      Key: uploadKey,
    };
    await s3.putObject(input).promise();
    
    const s3Url: string = `https://s3.amazonaws.com/${bucket}/${uploadKey.replace(/[ ]/g, "%20")}`
    
    const lastmileUploadUrl: string = LASTMILE_BASE_URI + "api/aiconfig/upload";
    const response = await ufetch.post(lastmileUploadUrl, {"url": s3Url, "source": "vscode"});
    if (response?.id !== null && response?.id !== undefined) {
      const renderingUrl: string = LASTMILE_BASE_URI + `aiconfig/${response?.id}`;
      vscode.window.showInformationMessage("shareUri: " + renderingUrl);
    }
  });
  context.subscriptions.push(shareCommand);

  // Run the setup command on activation
  vscode.commands.executeCommand(COMMANDS.INIT);

  vscode.window.showInformationMessage("Hello World from aiconfig-editor!");

  // Register our custom editor providers
  context.subscriptions.push(
    AIConfigEditorProvider.register(context, extensionOutputChannel)
  );
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("Deactivated AIConfig extension");
}

/**
 * Installs the dependencies required for the AIConfig extension to work
 */
async function installDependencies(
  context: vscode.ExtensionContext,
  outputChannel: vscode.LogOutputChannel
) {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Initializing AIConfig Extension",
      cancellable: false,
    },
    async (progress, cancellationToken) => {
      outputChannel.appendLine("Initializing extension");

      outputChannel.appendLine("1. Making sure Python is installed");
      progress.report({
        increment: 0,
        message: "Checking Python installation",
      });

      const isPythonInstalled = await checkPython();
      if (!isPythonInstalled) {
        outputChannel.appendLine("Python is not installed");
        return;
      }

      outputChannel.append(" -- SUCCESS");
      outputChannel.appendLine("2. Making sure pip is installed");

      progress.report({
        increment: 20,
        message: "Checking pip installation",
      });

      const isPipInstalled = await checkPip();
      if (!isPipInstalled) {
        outputChannel.appendLine("Pip is not installed");
        return;
      }

      outputChannel.append(" -- SUCCESS");
      outputChannel.appendLine("3. Checking dependencies to install or update");

      progress.report({
        increment: 20,
        message: "Checking dependencies to install or update",
      });

      // Check if requirements need to be installed
      const requirementsInstalled = await checkRequirements(
        context,
        outputChannel
      );
      if (requirementsInstalled) {
        outputChannel.append(" -- SUCCESS");
        // Requirements are already installed
        progress.report({
          increment: 40,
          message: "Dependencies are already installed. Let's go!",
        });
      } else {
        outputChannel.appendLine("Update required. Installing dependencies");

        // Install or update requirements
        progress.report({
          increment: 20,
          message: "Installing dependencies",
        });

        const installationResult = await installRequirements(
          context,
          progress,
          cancellationToken,
          outputChannel
        );
        if (!installationResult) {
          // The installation encountered issues -- the installRequirements function will have already shown an error message
          outputChannel.error(
            "Failed to install dependencies. Please try again."
          );
          return;
        } else {
          // Installation was successful
          progress.report({
            increment: 40,
            message: "Dependencies installed. Let's go!",
          });

          outputChannel.append(" -- SUCCESS");
        }
      }
    }
  );
}

/**
 * Installs the packages in the requirements.txt file needed for the AIConfig extension to work.
 */
async function installRequirements(
  context: vscode.ExtensionContext,
  progress: vscode.Progress<{
    message?: string | undefined;
    increment?: number | undefined;
  }>,
  cancellationToken: vscode.CancellationToken,
  outputChannel: vscode.LogOutputChannel
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
      outputChannel.info(`pip install: ${data}`);
      console.log(`pip install stdout: ${data}`);
    });

    pipInstall.stderr.on("data", (data) => {
      outputChannel.error(`pip install: ${data}`);
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
              installRequirements(
                context,
                progress,
                cancellationToken,
                outputChannel
              );
            }
          });
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Runs the check_requirements.py script to check if any requirements need to be updated or installed.
 */
async function checkRequirements(
  context: vscode.ExtensionContext,
  outputChannel: vscode.LogOutputChannel
) {
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
      outputChannel.info(`check_requirements: ${data}`);
    });

    checkRequirements.on("close", (code) => {
      if (code !== 0) {
        // Need to install requirements
        const msg = "Requirements are not installed or out of date";
        outputChannel.warn(`check_requirements: ${msg}`);
        console.log(msg);
        resolve(false);
      } else {
        // Requirements are installed
        const msg = "Requirements are already installed";
        outputChannel.info(`check_requirements: ${msg}`);

        console.log(msg);
        resolve(true);
      }
    });

    checkRequirements.on("error", (err) => {
      outputChannel.error(err);
      reject(err);
    });
  });
}

/**
 * Checks if Python is installed on the system, and if not, prompts the user to install it.
 */
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

/**
 * Checks if pip is installed on the system, and if not, prompts the user to install it.
 */
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

function getTodayDateString(): string {
  const date = new Date();
  const dateString = `${date.getFullYear()}_${
    date.getMonth() + 1 // getMonth() returns 0-11
  }_${date.getDate()}`;
  const timeString = `${date.getUTCHours()}_${date.getUTCMinutes()}_${date.getUTCSeconds()}`;
  return `${dateString}_${timeString}`;
}

// s3 file uris cannot have '+' character, so replace with '_'
function sanitizeFileName(name: string) {
  return name.replace(/[_+]/g, "_");
}
