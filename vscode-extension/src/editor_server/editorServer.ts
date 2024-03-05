import * as vscode from "vscode";
import { EXTENSION_NAME } from "../util";
import { getPythonPath } from "../utilities/pythonSetupUtils";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import serverPortManager from "./serverPortManager";
import { ENV_FILE_PATH } from "../constants";

export enum EditorServerState {
  Starting = "Starting",
  Running = "Running",
  Stopped = "Stopped",
}

/**
 * Provider for AIConfig editors.
 *
 * AIConfig editors are used for `.aiconfig`, `.aiconfig.json` and `.aiconfig.yaml` files.
 * These files are backed by a JSON schema under the hood.
 */
export class EditorServer {
  private cwd: string;
  private _onDidChangeState = new vscode.EventEmitter<EditorServerState>();
  private _onRestart = new vscode.EventEmitter<EditorServer>();

  // Readable and process listeners. Maintain at the class level so that subscribers don't
  // need to care about underlying server process
  private _onStdout = new vscode.EventEmitter<any>();
  private _onStderr = new vscode.EventEmitter<any>();
  private _onSpawn = new vscode.EventEmitter<void>();
  private _onClose = new vscode.EventEmitter<number>();
  private _onError = new vscode.EventEmitter<Error>();

  public pid: number | null = null;
  public port: number | null = null;

  // TODO: Should make this private and expose subscriptions to .stderr, .stdout, and .on
  public serverProc: ChildProcessWithoutNullStreams | null = null;
  public serverState: EditorServerState = EditorServerState.Stopped;
  public url: string | null = null;

  public readonly onDidChangeState = this._onDidChangeState.event;
  public readonly onRestart = this._onRestart.event;

  public readonly onStdout = this._onStdout.event;
  public readonly onStderr = this._onStderr.event;
  public readonly onSpawn = this._onSpawn.event;
  public readonly onClose = this._onClose.event;
  public readonly onError = this._onError.event;

  constructor(workingDirectory: string) {
    this.cwd = workingDirectory;
  }

  private updateServerState(state: EditorServerState) {
    this.serverState = state;
    this._onDidChangeState.fire(state);
  }

  public async start(): Promise<void> {
    if (this.serverProc) {
      console.log(
        `Server process ${this.pid} already started, port ${this.port}`
      );
      return;
    }

    console.log("Starting editor server process");
    this.updateServerState(EditorServerState.Starting);

    try {
      // If there is a custom model registry path, pass it to the server
      const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
      const modelRegistryPath = config.get<string>("modelRegistryPath");
      const modelRegistryPathArgs = modelRegistryPath
        ? ["--parsers-module-path", modelRegistryPath]
        : [];
      const filePath = config.get(ENV_FILE_PATH) as string;
      const envFilePathArgs = filePath ? ["--env-file-path", filePath] : [];

      this.port = await serverPortManager.getPort();

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
          ...envFilePathArgs,
        ],
        {
          cwd: this.cwd,
        }
      );

      this.pid = startServer.pid;
      this.serverProc = startServer;
      this.url = `http://localhost:${this.port}`;

      startServer.stdout.on("data", (data) => {
        this._onStdout.fire(data);
      });

      startServer.stderr.on("data", (data) => {
        this._onStderr.fire(data);
      });

      startServer.on("spawn", () => {
        this._onSpawn.fire();
      });

      startServer.on("close", (code) => {
        this._onClose.fire(code);
      });

      startServer.on("error", (err) => {
        this._onError.fire(err);
      });

      this.updateServerState(EditorServerState.Running);

      console.log(
        `Started editor server process ${this.pid}, port ${this.port}`
      );
    } catch (e) {
      console.error("Error starting editor server process", e);
      this.updateServerState(EditorServerState.Stopped);
      throw e;
    }
  }

  public stop() {
    console.log(`Killing editor server process ${this.pid}, port ${this.port}`);
    this.serverProc?.kill();
    this.serverProc = null;
    this.pid = null;
    this.port = null;
    this.url = null;
    this.updateServerState(EditorServerState.Stopped);
  }

  public async restart(): Promise<void> {
    console.log(
      `Restarting editor server process ${this.pid}, port ${this.port}`
    );
    this.stop();
    await this.start();
    this._onRestart.fire(this);
  }
}
