/**
 * Copyright (c) LastMile AI, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";

const isMacOS = ExecutionEnvironment.canUseDOM
  ? navigator.platform.startsWith("Mac")
  : false;
const isWindows = ExecutionEnvironment.canUseDOM
  ? navigator.platform.startsWith("Win")
  : false;

const defaultSyntax = "functional";

const nodePackageManagers = [
  { label: "npm", value: "npm" },
  { label: "Yarn", value: "yarn" },
];
const defaultNodePackageManager = "npm";

const pythonPackageManagers = [
  { label: "pip", value: "pip" },
  { label: "poetry", value: "poetry" },
];
const defaultPythonPackageManager = "pip";

const aiConfigLanguages = [
  { label: "Node.js (TypeScript)", value: "node" },
  { label: "Python", value: "python" },
];
const defaultAIConfigLanguage = "python";

const platforms = [
  { label: "Android", value: "android" },
  { label: "iOS", value: "ios" },
];
const defaultPlatform = isMacOS ? "ios" : "android";

const oses = [
  { label: "macOS", value: "macos" },
  { label: "Windows", value: "windows" },
  { label: "Linux", value: "linux" },
];
const defaultOs = isMacOS ? "macos" : isWindows ? "windows" : "linux";

const getDevNotesTabs = (tabs = ["android", "ios", "web", "windows"]) =>
  [
    tabs.includes("android")
      ? { label: "Android", value: "android" }
      : undefined,
    tabs.includes("ios") ? { label: "iOS", value: "ios" } : undefined,
    tabs.includes("web") ? { label: "Web", value: "web" } : undefined,
    tabs.includes("windows")
      ? { label: "Windows", value: "windows" }
      : undefined,
  ].filter(Boolean);

export default {
  defaultOs,
  defaultNodePackageManager,
  defaultPythonPackageManager,
  defaultPlatform,
  defaultSyntax,
  defaultAIConfigLanguage,
  getDevNotesTabs,
  oses,
  nodePackageManagers,
  pythonPackageManagers,
  platforms,
  aiConfigLanguages,
};
