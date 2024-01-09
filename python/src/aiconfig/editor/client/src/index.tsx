import React from "react";
import ReactDOM from "react-dom/client";
import LocalEditor from "./LocalEditor";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <LocalEditor />
  </React.StrictMode>
);
