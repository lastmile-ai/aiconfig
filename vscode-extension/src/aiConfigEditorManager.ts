import vscode from "vscode";
import { EditorServer } from "./editor_server/editorServer";

export class AIConfigEditorState {
  constructor(
    public document: vscode.TextDocument,
    public readonly webviewPanel: vscode.WebviewPanel,
    public editorServer: EditorServer | null,
    private readonly manager: AIConfigEditorManager
  ) {
    // Listen to when the panel's view state changes and update the active editor
    this.webviewPanel.onDidChangeViewState((e) => {
      if (e.webviewPanel.active) {
        this.manager.setActiveEditor(this);
      } else if (this.manager.getActiveEditor() === this) {
        this.manager.setActiveEditor(null);
      }
    });

    this.webviewPanel.onDidDispose(() => {
      // If the webview panel has been closed, remove it from the manager as well
      this.manager.removeEditor(this);
    });
  }
}

export class AIConfigEditorManager {
  private activeEditor: AIConfigEditorState | null;
  private activeEditorUri: string;
  private editorsByUri: Map<string, AIConfigEditorState> = new Map();

  constructor() {
    this.activeEditor = null;
    this.activeEditorUri = null;
  }

  setActiveEditor(editor: AIConfigEditorState | null) {
    this.activeEditor = editor;
    this.activeEditorUri = editor?.document.uri.toString();
  }

  getActiveEditor() {
    return this.activeEditor;
  }

  getRegisteredEditors() {
    return this.editorsByUri.values();
  }

  addEditor(editor: AIConfigEditorState, uri?: string) {
    this.editorsByUri.set(uri ?? editor.document.uri.toString(), editor);
    this.setActiveEditor(editor);
    if (uri) {
      this.activeEditorUri = uri;
    }
  }

  getEditor(document: vscode.TextDocument) {
    return this.getEditorByUri(document.uri.toString());
  }

  getEditorByUri(uri: string) {
    return this.editorsByUri.get(uri);
  }

  removeEditor(editor: AIConfigEditorState) {
    this.editorsByUri.delete(editor.document.uri.toString());
    if (this.activeEditor === editor) {
      this.activeEditor = null;
    }
  }

  removeEditorByUri(uri: string) {
    this.editorsByUri.delete(uri);
    if (
      this.activeEditorUri === uri ||
      this.activeEditor?.document?.uri.toString() === uri
    ) {
      this.activeEditor = null;
      this.activeEditorUri = null;
    }
  }
}
