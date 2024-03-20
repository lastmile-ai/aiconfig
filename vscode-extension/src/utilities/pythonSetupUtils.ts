/**
 * General file for setting all the utility methods related to Python
 * installation settings, including:
 *  - python interpreter
 *  = python version
 *  - pip package
 *  - pip dependencies
 */

import * as vscode from "vscode";

import { exec, execSync, spawn } from "child_process";
import path from "path";
import { COMMANDS, EXTENSION_NAME, getConfigurationTarget } from "../util";
import { PythonExtension } from "@vscode/python-extension";
import { PYTHON_INTERPRETER_CACHE_KEY_NAME } from "../constants";

/**
 * Implement for the Initialize Extension command.
 * This selects a Python interpreter and initiates the dependency
 * installation flow.
 */
export async function initialize(
  context: vscode.ExtensionContext,
  outputChannel: vscode.LogOutputChannel
) {
  // Make sure Python API is activated
  const pythonApi: PythonExtension = await PythonExtension.api();

  await vscode.commands.executeCommand("python.setInterpreter");

  await installDependencies(context, outputChannel);
}

/**
 * Installs the dependencies required for the AIConfig extension to work
 */
export async function installDependencies(
  context: vscode.ExtensionContext,
  outputChannel: vscode.LogOutputChannel
): Promise<void> {
  await vscode.window.withProgress(
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
      await savePythonInterpreterToCache();

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
export async function installRequirements(
  context: vscode.ExtensionContext,
  progress: vscode.Progress<{
    message?: string | undefined;
    increment?: number | undefined;
  }>,
  cancellationToken: vscode.CancellationToken,
  outputChannel: vscode.LogOutputChannel
): Promise<boolean> {
  const extensionPath = context.extensionPath;
  const requirementsPath = path.join(
    extensionPath,
    "python",
    "requirements.txt"
  );
  const pythonPath = await getPythonPath();

  return new Promise((resolve, _reject) => {
    const pipInstall = spawn(pythonPath, [
      "-m",
      "pip",
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
            `Failed to install dependencies. Pip exited with code ${code}.`,
            ...["Change Interpreter", "Retry", "Fix Manually"]
          )
          .then((selection) => {
            if (selection === "Retry") {
              installRequirements(
                context,
                progress,
                cancellationToken,
                outputChannel
              );
            } else if (selection === "Change Interpreter") {
              vscode.commands.executeCommand(COMMANDS.INIT);
            } else if (selection === "Fix Manually") {
              vscode.window
                .showInformationMessage(
                  "Try installing 'python-aiconfig' package manually using the command pip3 install python-aiconfig in your terminal/shell.",
                  ...["Copy command to Clipboard"]
                )
                .then((selection) => {
                  if (selection === "Copy command to Clipboard") {
                    vscode.env.clipboard.writeText(
                      "pip3 install python-aiconfig"
                    );
                  }
                });
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
export async function checkRequirements(
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

  const pythonPath = await getPythonPath();

  return new Promise((resolve, reject) => {
    let checkRequirements = spawn(pythonPath, [
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
export async function checkPython() {
  const pythonPath = await getPythonPath();
  return new Promise((resolve, _reject) => {
    exec(pythonPath + " --version", (error, stdout, stderr) => {
      if (error) {
        console.error("Python was not found, can't install requirements");
        console.error("retrieved python path: " + pythonPath);
        console.error("error: " + error);

        // Guide for installation
        showGuideForPythonInstallation(
          "Specified Python Interpreter is not valid"
        );
        resolve(false);
      } else if (!isPythonVersionAtLeast310(pythonPath)) {
        showGuideForPythonInstallation(
          "Python version is not 3.10 or higher. Please upgrade to Python 3.10 or higher."
        );
        console.error(
          "Python version is not 3.10 or higher. Please upgrade to Python 3.10 or higher."
        );
        resolve(false);
        // show guide for installation
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
export async function checkPip() {
  const pythonPath = await getPythonPath();
  return new Promise((resolve, _reject) => {
    // when calling pip using `python -m`, no need to worry about pip vs pip3.
    // You're directly specifying which Python environment's pip to use.
    exec(pythonPath + " -m pip --version", (error, stdout, stderr) => {
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

/**
 * AIConfig Vscode extension has a dependency on the Python extension.
 * This function retrieves and returns the path to the current python interpreter.
 * @returns the path to the current python interpreter
 */
export async function getPythonPath(): Promise<string> {
  const pythonExtension = vscode.extensions.getExtension("ms-python.python");
  if (!pythonExtension.isActive) {
    await pythonExtension.activate();
  }

  const pythonPath =
    pythonExtension.exports.settings.getExecutionDetails().execCommand[0];
  return pythonPath;
}

/**
 * Save the python interpreter path to the VS Code extension workspace settings
 * @returns void
 */
export async function savePythonInterpreterToCache(): Promise<void> {
  const pythonPath = await getPythonPath();
  const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
  await config.update(
    PYTHON_INTERPRETER_CACHE_KEY_NAME,
    pythonPath,
    getConfigurationTarget()
  );
}

/**
 * This initializes the flow to ensure the Python setup is bullet-proof
 * It gets called upon opening or creating an AIConfig file or updating
 * the server
 */
export async function initializePythonFlow(
  context: vscode.ExtensionContext,
  outputChannel: vscode.LogOutputChannel
): Promise<void> {
  if (!checkIfPythonInterpreterCacheIsDefined()) {
    await initialize(context, outputChannel);
  } else {
    // This is technically just a check if all the dependencies are all
    // installed otherwise we don't need to install anything else and it
    // simply runs through the installation flow
    await installDependencies(context, outputChannel);
  }
}

export function checkIfPythonInterpreterCacheIsDefined(): boolean {
  const pythonPath = getPythonInterpreterFromCache();
  if (!pythonPath) {
    return false;
  }
  return true;
}

function getPythonInterpreterFromCache(): string | undefined {
  const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
  return config.get<string>(PYTHON_INTERPRETER_CACHE_KEY_NAME);
}

/**
 * Checks if the specified Python interpreter is version 3.10 or higher.
 * @param pythonPath The path to the Python interpreter.
 * @returns A promise that resolves to a boolean indicating if the version is >= 3.10.
 */

export function isPythonVersionAtLeast310(pythonPath: string): boolean {
  try {
    // Use Python to check compatible version
    // This approach circumvents the complexity of parsing version strings from `python --version`,
    // which can vary in format and require custom parsing and comparison logic to handle different version schemes (e.g., major, minor, micro).
    const command = `${pythonPath} -c "import sys; print(sys.version_info >= (3, 10))"`;
    const output = execSync(command).toString().replace(/\s+/g, "").trim(); //replace newlines & whitespace

    return output === "True";
  } catch (error) {
    console.debug("Error checking Python version:", error);
    return false;
  }
}

export function showGuideForPythonInstallation(message: string): void {
  // Guide for installation
  vscode.window
    .showErrorMessage(message, ...["Install Python", "Retry"])
    .then((selection) => {
      if (selection === "Install Python") {
        vscode.env.openExternal(
          vscode.Uri.parse("https://www.python.org/downloads/")
        );
        showNotificationToRestartVsCode();
      } else if (selection === "Retry") {
        vscode.commands.executeCommand(COMMANDS.INIT);
      }
    });
}

export async function showNotificationToRestartVsCode(): Promise<void> {
  // block on selection. Otherwise, the installation flow continues and will eventually cache the wrongly selected interpreter.
  const selection = await vscode.window.showInformationMessage(
    "After installing Python, please restart VS Code to complete the installation of the AIConfig extension",
    "Restart"
  );

  if (selection === "Restart") {
    vscode.commands.executeCommand("workbench.action.reloadWindow");
  }
}
