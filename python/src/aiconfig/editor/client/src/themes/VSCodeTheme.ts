import { MantineThemeOverride } from "@mantine/core";

export const VSCODE_THEME: MantineThemeOverride = {
  defaultGradient: {
    from: "#ff1cf7",
    to: "#ff1cf7",
    deg: 45,
  },

  globalStyles: () => ({
    body: {
      padding: "0 !important",
      color: "var(--vscode-editor-foreground)",
    },
    ".editorBackground": {
      background: "var(--vscode-editor-background)",
      margin: "0 auto",
      minHeight: "100vh",
    },
    ".monoFont": {
      fontFamily:
        "sf mono, ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
    ".ghost": {
      border: "none",
      borderRadius: "4px",
      padding: "4px",
      margin: "0px",
      backgroundColor: "transparent",
      ":hover": {
        backgroundColor: "rgba(226,232,255,.1)",
      },
      input: {
        maxHeight: "16px",
        fontFamily:
          "sf mono, ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        border: "none",
        borderRadius: "4px",
        padding: "4px",
        margin: "0px",
        backgroundColor: "transparent",
      },
    },
    ".cellStyle": {
      border: "1px solid",
      borderColor: "var(--vscode-notebook-cellBorderColor) !important",
      backgroundColor: "var(--vscode-editorWidget-background)",
      flex: 1,
      color: "var(--vscode-editor-foreground)",
      borderTopRightRadius: "0px",
      borderBottomRightRadius: "0px",
      borderTopLeftRadius: "0px",
      borderBottomLeftRadius: "0px",
      ":hover": {
        background: "rgba(249, 250, 251, 0.01) !important",
      },
      textarea: {
        border: "1px solid !important",
        borderColor: "var(--vscode-notebook-cellBorderColor) !important",
        color: "var(--vscode-editor-foreground)",
        borderRadius: "0px",
        margin: "0px 0px 0px 0px",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
        backgroundColor: "var(--vscode-input-background)",
        ":focus": {
          outline: "solid 1px #ff1cf7 !important",
          outlineOffset: "-1px",
        },
      },
      ".mantine-InputWrapper-label": {
        display: "none",
      },
    },
    ".sidePanel": {
      border: "1px solid",
      borderColor: "var(--vscode-notebook-cellBorderColor)",
      borderLeft: "none",
      color: "var(--vscode-editor-foreground)",
      borderTopRightRadius: "0px",
      borderBottomRightRadius: "0px",
      background: "var(--vscode-activityBar-background)",
      minWidth: "32px",
      input: {
        border: "1px solid #E5E7EB !important",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
        backgroundColor: "var(--vscode-input.background)",
        ":focus": {
          outline:
            "solid 1px var(--vscode-inputOption-activeBorder) !important",
          outlineOffset: "-1px",
        },
      },
    },
    ".runPromptButton": {
      background: "#ff1cf7",
      color: "white",
      borderRadius: "0",
      height: "auto",
      "&:hover": {
        background: "#ff46f8",
      },
    },
  }),
};
