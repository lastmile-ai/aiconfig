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
    ".addPromptRow": {
      borderRadius: "0px",
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

      color: "var(--vscode-editor-foreground)",
      backgroundColor: "var(--vscode-input-background)",

      ":hover": {
        backgroundColor: "rgba(226,232,255,.1)",
      },
      input: {
        maxHeight: "16px",
        fontFamily:
          "sf mono, ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        border: "none",
        borderRadius: "4px",
        margin: "0px",
        backgroundColor: "var(--vscode-input-background)",
        color: "var(--vscode-editor-foreground)",
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
      background: "var(--vscode-sideBar-background)",
      minWidth: "32px",
      input: {
        borderRadius: "0px",
        border: "1px solid",
        borderColor: "var(--vscode-notebook-cellBorderColor)",
        color: "var(--vscode-editor-foreground)",
        backgroundColor: "var(--vscode-input-background)",
        ":focus": {
          outline:
            "solid 1px var(--vscode-inputOption-activeBorder) !important",
          outlineOffset: "-1px",
        },
      },
      textarea: {
        borderRadius: "0px",
        border: "1px solid",
        borderColor: "var(--vscode-notebook-cellBorderColor)",
        color: "var(--vscode-editor-foreground)",
        backgroundColor: "var(--vscode-input-background)",
        ":focus": {
          outline:
            "solid 1px var(--vscode-inputOption-activeBorder) !important",
          outlineOffset: "-1px",
        },
      },
      label: {
        color: "var(--vscode-editor-foreground) !important",
      },
      button: {
        color: "var(--vscode-editor-foreground) !important",
        borderColor: "ff1cf7 !important",
      },
    },
    ".runPromptButton": {
      background: "var(--vscode-button-background)",
      color: "white",
      borderRadius: "0",
      height: "auto",
      "&:hover": {
        background: "var(--vscode-button-hoverBackground)",
      },
    },
    ".primaryButton": {
      background: "var(--vscode-button-background)",
      color: "white",
      "&:hover": {
        background: "var(--vscode-button-hoverBackground)",
      },
    },
    ".secondaryButton": {
      background: "var(--vscode-button-secondaryBackground)",
      color: "white",
      "&:hover": {
        background: "var(--vscode-button-secondaryHoverBackground)",
      },
    },
    ".divider": {
      borderTopWidth: "1px",
      borderTopColor: "var(--vscode-notebook-cellBorderColor)",
      marginBottom: "0.5em",
    },

    ".configMetadataContainer": {
      width: "100%",
      maxHeight: "-webkit-fill-available",
      margin: "16px auto",
      padding: "0",
      background: "var(--vscode-sideBar-background)",
      color: "var(--vscode-editor-foreground) !important",
      borderRadius: "0px",
      border: "1px solid",
      borderColor: "var(--vscode-notebook-cellBorderColor)",
      textAlign: "left",
      button: {
        ":hover": {
          backgroundColor: "var(--vscode-toolbar-hoverBackground)",
        },
      },
      input: {
        border: "1px solid",
        borderColor: "var(--vscode-notebook-cellBorderColor)",
        borderRadius: "0px",
        color: "var(--vscode-editor-foreground)",
        backgroundColor: "var(--vscode-input-background) !important",
        ":focus": {
          outline:
            "solid 1px var(--vscode-inputOption-activeBorder) !important",
          outlineOffset: "-1px",
        },
      },
      textarea: {
        border: "1px solid",
        borderColor: "var(--vscode-notebook-cellBorderColor)",
        borderRadius: "0px",
        color: "var(--vscode-editor-foreground)",
        backgroundColor: "var(--vscode-input-background) !important",
        ":focus": {
          outline:
            "solid 1px var(--vscode-inputOption-activeBorder) !important",
          outlineOffset: "-1px",
        },
      },

      ".addParameterButton": {
        position: "sticky",
        left: "0",
        bottom: "0",
        margin: "16px 0 0 0",
        borderRadius: "0px",
        background: "var(--vscode-button-background)",
        ":hover": {
          backgroundColor: "var(--vscode-button-hoverBackground)",
        },
        path: {
          color: "#fff",
        },
      },
      ".promptMenuButton": {
        marginLeft: -8,
        background: "var(--vscode-button-secondaryBackground)",
        color: "white",
        ":hover": {
          backgroundColor: "var(--vscode-button-hoverBackground)",
        },
      },
    },
  }),
};
