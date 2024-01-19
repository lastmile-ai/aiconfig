import React from "react";
import ReactDOM from "react-dom/client";
import LocalEditor from "./LocalEditor";
import WebviewContext from "./WebviewContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <WebviewContext.Provider value={{ vscode: acquireVsCodeApi() }}>
      <LocalEditor />
    </WebviewContext.Provider>
  </React.StrictMode>
);
