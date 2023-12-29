import React from "react";
import ReactDOM from "react-dom/client";
import Editor from "./Editor";
import WebviewContext from "./WebviewContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <WebviewContext.Provider value={{ vscode: acquireVsCodeApi() }}>
      <Editor />
    </WebviewContext.Provider>
  </React.StrictMode>
);
