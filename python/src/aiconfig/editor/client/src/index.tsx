import React from "react";
import ReactDOM from "react-dom/client";
import Editor from "./Editor";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <Editor />
  </React.StrictMode>
);
