// const vscode = acquireVsCodeApi();

/**
 * We render our welcome message in a markdown preview, which does not allow extensions to run commands.
 * Instead, our extension registers this script to run on all markdown previews and add the appropriate
 * command handlers when the markdown preview contains the relevant ids.
 */
async function registerCommands() {
  console.log("start registerCommands");
  document.addEventListener("click", async (event) => {
    if (!event) {
      return;
    }

    // Handle propagation of event from target through parent until we find the relevant
    // anchor tag with vscode-aiconfig command.
    let node = event.target;

    while (node) {
      if (!node) {
        return;
      }

      if (
        node.tagName === "A" &&
        node.href.startsWith("command:vscode-aiconfig")
      ) {
        const command = node.getAttribute("href");
        const aiconfigCommand = command.split(":")[1];

        console.log("Command: ", aiconfigCommand);
        if (!aiconfigCommand) {
          return;
        }

        console.log("Executing command: ", aiconfigCommand);
        await vscode.commands.executeCommand(aiconfigCommand);

        event.preventDefault();
        event.stopPropagation();
        return;
      }

      node = node.parentNode;
    }
  });
}

registerCommands();
