import * as vscode from "vscode";
import { type ChildProcessWithoutNullStreams, execSync } from "child_process";
import { setTimeout } from "timers/promises";
import { ufetch } from "ufetch";

import crypto from "crypto";
import fs from "fs";
import path from "path";
import os from "os";

export const EXTENSION_NAME = "vscode-aiconfig";
export const COMMANDS = {
  INIT: `${EXTENSION_NAME}.init`,
  CREATE_NEW_JSON: `${EXTENSION_NAME}.createAIConfigJSON`,
  CREATE_NEW_YAML: `${EXTENSION_NAME}.createAIConfigYAML`,
  HELLO_WORLD: `${EXTENSION_NAME}.helloWorld`,
  CUSTOM_MODEL_REGISTRY_PATH: `${EXTENSION_NAME}.customModelRegistryPath`,
  CREATE_CUSTOM_MODEL_REGISTRY: `${EXTENSION_NAME}.createCustomModelRegistry`,
  OPEN_CONFIG_FILE: `${EXTENSION_NAME}.openConfigFile`,
  OPEN_MODEL_REGISTRY: `${EXTENSION_NAME}.openModelRegistry`,
  SETUP_ENVIRONMENT_VARIABLES: `${EXTENSION_NAME}.setupEnvironmentVariables`,
  SHARE: `${EXTENSION_NAME}.share`,
  SHOW_WELCOME: `${EXTENSION_NAME}.showWelcome`,
};

export const SUPPORTED_FILE_EXTENSIONS = [".json", ".yaml"];

export function isSupportedConfigExtension(fileName: string) {
  return SUPPORTED_FILE_EXTENSIONS.includes(path.extname(fileName));
}

// Note: This is used for the share feature.
export const LASTMILE_BASE_URI: string = "https://lastmileai.dev/";

const EDITOR_SERVER_API_ENDPOINT = `/api`;

export const EDITOR_SERVER_ROUTE_TABLE = {
  TO_STRING: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/to_string"),
  SERVER_STATUS: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/server_status"),
  LOAD_CONTENT: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/load_content"),
  LOAD_MODEL_PARSER_MODULE: (hostUrl: string) =>
    urlJoin(hostUrl, EDITOR_SERVER_API_ENDPOINT, "/load_model_parser_module"),
};

export type ServerInfo = {
  proc: ChildProcessWithoutNullStreams;
  url: string;
};

export async function isServerReady(serverUrl: string) {
  try {
    const res = await ufetch.get(
      EDITOR_SERVER_ROUTE_TABLE.SERVER_STATUS(serverUrl)
    );

    const status = res.status;

    return status === "OK";
  } catch (err) {
    return false;
  }
}

export async function waitUntilServerReady(serverUrl: string) {
  // TODO: saqadri - set some max retry to prevent infinite loop
  let ready = await isServerReady(serverUrl);
  while (!ready) {
    // sleep for 100ms
    await setTimeout(/*delay*/ 100);
    ready = await isServerReady(serverUrl);
  }
}

export function updateWebviewEditorThemeMode(webview: vscode.Webview) {
  const isDarkMode =
    vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ||
    vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast;
  // ColorThemeKind.Light or ColorThemeKind.HighContrastLight is light mode
  webview.postMessage({
    type: "set_theme",
    theme: isDarkMode ? "dark" : "light",
  });
}

export async function updateServerState(
  serverUrl: string,
  document: vscode.TextDocument
) {
  return await ufetch.post(EDITOR_SERVER_ROUTE_TABLE.LOAD_CONTENT(serverUrl), {
    content: document.getText(),
    mode: getModeFromDocument(document),
  });
}

// Figure out what kind of AIConfig this is that we are loading
export function getModeFromDocument(
  document: vscode.TextDocument
): "json" | "yaml" {
  // determine mode from file path
  const documentPath = document.fileName;
  const ext = path.extname(documentPath)?.toLowerCase();
  if (ext === "yaml" || ext === ".yaml") {
    return "yaml";
  }

  // Default to json-mode
  return "json";
}

export async function getDocumentFromServer(
  serverUrl: string,
  document: vscode.TextDocument
): Promise<string> {
  const res = await ufetch.post(
    EDITOR_SERVER_ROUTE_TABLE.TO_STRING(serverUrl),
    {
      mode: getModeFromDocument(document),
      include_outputs: true,
    }
  );

  // TODO: saqadri - handle error cases
  return res.aiconfig_string;
}

export async function updateModelRegistryPath(
  serverUrl: string,
  customModelRegistryPath: string
): Promise<string> {
  const res = await ufetch.post(
    EDITOR_SERVER_ROUTE_TABLE.LOAD_MODEL_PARSER_MODULE(serverUrl),
    {
      path: customModelRegistryPath,
    }
  );

  // TODO: saqadri - handle error cases
  return res;
}

export function isValidFilePath(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export function getCurrentWorkingDirectory(document: vscode.TextDocument) {
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

export function getTodayDateString(): string {
  const date = new Date();
  const dateString = `${date.getFullYear()}_${
    date.getMonth() + 1 // getMonth() returns 0-11
  }_${date.getDate()}`;
  const timeString = `${date.getUTCHours()}_${date.getUTCMinutes()}_${date.getUTCSeconds()}`;
  return `${dateString}_${timeString}`;
}

// s3 file uris cannot have '+' character, so replace with '_'
export function sanitizeFileName(name: string) {
  return name.replace(/[_+]/g, "_");
}

//#region url-join
function normalize(strArray) {
  const resultArray = [];
  if (strArray.length === 0) {
    return "";
  }

  // Filter out any empty string values.
  strArray = strArray.filter((part) => part !== "");

  if (typeof strArray[0] !== "string") {
    throw new TypeError("Url must be a string. Received " + strArray[0]);
  }

  // If the first part is a plain protocol, we combine it with the next part.
  if (strArray[0].match(/^[^/:]+:\/*$/) && strArray.length > 1) {
    strArray[0] = strArray.shift() + strArray[0];
  }

  // If the first part is a leading slash, we combine it with the next part.
  if (strArray[0] === "/" && strArray.length > 1) {
    strArray[0] = strArray.shift() + strArray[0];
  }

  // There must be two or three slashes in the file protocol, two slashes in anything else.
  if (strArray[0].match(/^file:\/\/\//)) {
    strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, "$1:///");
  } else {
    strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, "$1://");
  }

  for (let i = 0; i < strArray.length; i++) {
    let component = strArray[i];

    if (typeof component !== "string") {
      throw new TypeError("Url must be a string. Received " + component);
    }

    if (i > 0) {
      // Removing the starting slashes for each component but the first.
      component = component.replace(/^[\/]+/, "");
    }
    if (i < strArray.length - 1) {
      // Removing the ending slashes for each component but the last.
      component = component.replace(/[\/]+$/, "");
    } else {
      // For the last component we will combine multiple slashes to a single one.
      component = component.replace(/[\/]+$/, "/");
    }

    if (component === "") {
      continue;
    }

    resultArray.push(component);
  }

  let str = "";

  for (let i = 0; i < resultArray.length; i++) {
    const part = resultArray[i];

    // Do not add a slash if this is the first part.
    if (i === 0) {
      str += part;
      continue;
    }

    const prevPart = resultArray[i - 1];

    // Do not add a slash if the previous part ends with start of the query param or hash.
    if ((prevPart && prevPart.endsWith("?")) || prevPart.endsWith("#")) {
      str += part;
      continue;
    }

    str += "/" + part;
  }
  // Each input component is now separated by a single slash except the possible first plain protocol part.

  // remove trailing slash before parameters or hash
  str = str.replace(/\/(\?|&|#[^!])/g, "$1");

  // replace ? and & in parameters with &
  const [beforeHash, afterHash] = str.split("#");
  const parts = beforeHash.split(/(?:\?|&)+/).filter(Boolean);
  str =
    parts.shift() +
    (parts.length > 0 ? "?" : "") +
    parts.join("&") +
    (afterHash && afterHash.length > 0 ? "#" + afterHash : "");

  return str;
}

export function urlJoin(...args) {
  const parts = Array.from(Array.isArray(args[0]) ? args[0] : args);
  return normalize(parts);
}
//#endregion

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

/**
 * Creates an .env file (or opens it if it already exists) to define environment variables
 * 1) If .env file exists:
 *    a) Add helper lines on how to add common API keys (if not currently present)
 * 2) If .env file doesn't exist
 *    b) Add template file containing helper lines from 1a above
 */
export async function setupEnvironmentVariables(context: vscode.ExtensionContext) {
  // Use home dir because env variables should be global. I get the argument
  // for having in the workspace dir. I personally feel this is more
  // annoying to setup every time you create a new project when using the
  // same API keys, but I can do whatever option you want, not hard to
  // implement
  const homedir = require("os").homedir(); // This is cross-platform: https://stackoverflow.com/a/9081436
  const defaultEnvPath = path.join(homedir, ".env");

  const workspacePath = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : null;

  const envPath = await vscode.window.showInputBox({
    prompt: "Enter the path of your .env file",
    value: defaultEnvPath,
    validateInput: (input) => validateEnvPath(input, workspacePath),
  });

  if (!envPath) {
    vscode.window.showInformationMessage(
      "Environment variable setup cancelled"
    );
    return;
  }

  const envTemplatePath = vscode.Uri.joinPath(
    context.extensionUri,
    "static",
    "env_template.env"
  );

  if (fs.existsSync(envPath)) {
    const helperText = (
      await vscode.workspace.fs.readFile(envTemplatePath)
    ).toString();

    // TODO: Check if we already appended the template text to existing .env
    // file before. If we did, don't do it again
    fs.appendFile(envPath, "\n\n" + helperText, function (err) {
      if (err) {
        throw err;
      }
      console.log(
        `Added .env template text from ${envTemplatePath.fsPath} to ${envPath}`
      );
    });
  } else {
    // Create the .env file from the sample
    try {
      await vscode.workspace.fs.copy(
        envTemplatePath,
        vscode.Uri.file(envPath),
        { overwrite: false }
      );
    } catch (err) {
      vscode.window.showErrorMessage(
        `Error creating new file ${envTemplatePath}: ${err}`
      );
    }
  }

  // Open the env file that was either was created or already existed
  const doc = await vscode.workspace.openTextDocument(envPath);
  if (doc) {
    vscode.window.showTextDocument(doc, {
      preview: false,
      // Tried using vscode.ViewColumn.Active but that overrides existing
      // walkthrough window
      viewColumn: vscode.ViewColumn.Beside,
    });
    vscode.window.showInformationMessage(
      "Please define your environment variables."
    );
  }
}

function validateEnvPath(
  inputPath: string,
  workspacePath: string | null
): string | null {
  if (!inputPath) {
    return "File path is required";
  } else if (!inputPath.endsWith(".env")) {
    return 'File path must end in ".env"';
  } else if (path.basename(inputPath) !== ".env") {
    return 'Filename of the fully qualified path must be ".env"';
  } else if (workspacePath !== null) {
    // Note: If the workspacePath is equal to inputPath,
    // relativePathFromEnvToWorkspace will be empty string
    const relativePathFromEnvToWorkspace = path.relative(
      path.dirname(inputPath),
      workspacePath
    );
    if (relativePathFromEnvToWorkspace.startsWith("..")) {
      return `File path must either be contained within the VS Code workspace directory ('${workspacePath}') or within a one of it's parent folders`;
    }
  }
  return null;
}
