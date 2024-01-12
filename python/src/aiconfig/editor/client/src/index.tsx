import React from "react";
import ReactDOM from "react-dom/client";
import LocalEditor from "./LocalEditor";

import { datadogLogs } from "@datadog/browser-logs";

datadogLogs.init({
  clientToken: "pub356987caf022337989e492681d1944a8",
  env: process.env.NODE_ENV ?? "development",
  service: "aiconfig-editor",
  site: "us5.datadoghq.com",
  forwardErrorsToLogs: true,
  sessionSampleRate: 100,
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <LocalEditor />
  </React.StrictMode>
);
