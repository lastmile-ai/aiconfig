/**
 * Utils file for handling actions to perform whenever user
 * installs or updates the extension.
 * VS Code automatically checks for version updates
 * (https://code.visualstudio.com/docs/editor/extension-marketplace#_extension-autoupdate)
 * but I haven't been able to find a way to use this to trigger any
 * actions. Also even though the Walkthrough documentation says
 * that this gets triggered on first install, I haven't been able
 * to trigger this either, so I am calling this manually
 * https://code.visualstudio.com/api/references/contribution-points#contributes.walkthroughs
 */

import * as vscode from "vscode";

import { EXTENSION_NAME } from "../util";
import { VERSION_KEY_NAME } from "../constants";

export async function performVersionInstallAndUpdateActionsIfNeeded(
  context: vscode.ExtensionContext
) {
  const extension = context.extension;
  const currExtensionVersion = extension.packageJSON.version;
  const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
  const lastActivatedVersion = config.get<string>(VERSION_KEY_NAME);
  if (currExtensionVersion !== lastActivatedVersion) {
    await config.update(
      VERSION_KEY_NAME,
      currExtensionVersion,
      vscode.ConfigurationTarget.Global
    );
  }

  if (lastActivatedVersion === undefined || lastActivatedVersion === "") {
    // First time activating extension, show walkthrough
    vscode.commands.executeCommand(
      "workbench.action.openWalkthrough",
      "lastmile-ai.vscode-aiconfig#welcomeWalkthrough"
    );
  } else if (
    currExtensionVersion > lastActivatedVersion
    // TODO: Add check for if version string follows format of %d.%d.%d
  ) {
    // Extension has been updated, prompt user to refresh VS Code window
    // Will implement next PR
  }
}
