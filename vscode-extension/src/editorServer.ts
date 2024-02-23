import * as vscode from "vscode";
import { getPortPromise } from "portfinder";
import { EXTENSION_NAME } from "./util";
import { getPythonPath } from "./utilities/pythonSetupUtils";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

/**
 * Provider for AIConfig editors.
 *
 * AIConfig editors are used for `.aiconfig`, `.aiconfig.json` and `.aiconfig.yaml` files.
 * These files are backed by a JSON schema under the hood.
 */
export class EditorServer {
  private cwd: string;

  public pid: number | null = null;
  public port: number | null = null;
  // TODO: Should make this private and expose subscriptions to .stderr, .stdout, and .on
  public serverProc: ChildProcessWithoutNullStreams | null = null;
  public url: string | null = null;

  constructor(workingDirectory: string) {
    this.cwd = workingDirectory;
  }

  public async start(): Promise<EditorServer> {
    if (this.serverProc) {
      console.log(
        `Server process ${this.pid} already started, port ${this.port}`
      );
      return this;
    }

    // If there is a custom model registry path, pass it to the server
    const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
    const modelRegistryPath = config.get<string>("modelRegistryPath");
    const modelRegistryPathArgs = modelRegistryPath
      ? ["--parsers-module-path", modelRegistryPath]
      : [];

    this.port = await getPortPromise();

    const pythonPath = await getPythonPath();

    // TODO: saqadri - specify parsers_module_path
    // `aiconfig` command not useable here because it relies on python. Instead invoke the module directly.
    const startServer = spawn(
      pythonPath,
      [
        "-m",
        "aiconfig.scripts.aiconfig_cli",
        "start",
        "--server-port",
        this.port.toString(),
        ...modelRegistryPathArgs,
      ],
      {
        cwd: this.cwd,
      }
    );

    this.pid = startServer.pid;
    this.serverProc = startServer;
    this.url = `http://localhost:${this.port}`;

    return this;
  }

  public stop() {
    console.log(`Killing editor server process ${this.pid}`);
    this.serverProc.kill();
    this.serverProc = null;
    this.pid = null;
    this.port = null;
    this.url = null;
  }
}
