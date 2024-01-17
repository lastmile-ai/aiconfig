import { MantineThemeOverride } from "@mantine/core";

export const GRADIO_THEME: MantineThemeOverride = {
  headings: {
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, Arial, sans-serif",
    sizes: {
      h1: { fontSize: "2rem" },
    },
  },

  defaultGradient: {
    from: "#E88949",
    to: "#E85921",
    deg: 90,
  },

  //gradio light theme
  globalStyles: (theme) => ({
    ".editorBackground": {
      background: theme.colorScheme === "light" ? "white" : "#0b0f19",
      margin: "0 auto",
      minHeight: "100vh",
    },
    ".monoFont": {
      fontFamily:
        "sf mono, ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
    ".ghost": {
      input: {
        maxHeight: "16px",
        fontFamily:
          "sf mono, ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        borderRadius: "8px",
        margin: "8px 0px 0px 0px",
        backgroundColor: theme.colorScheme === "light" ? "white" : "#384152",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
        ":focus": {
          outline: "solid 1px #E85921 !important",
          outlineOffset: "-1px",
        },
      },
    },
    ".cellStyle": {
      border: "1px solid",
      borderColor: theme.colorScheme === "light" ? "#E5E7EB" : "#384152",
      background: theme.colorScheme === "light" ? "white" : "#1f2938",
      flex: 1,
      borderTopRightRadius: "0px",
      borderBottomRightRadius: "0px",
      borderTopLeftRadius: "8px",
      borderBottomLeftRadius: "8px",
      ":hover": {
        background:
          theme.colorScheme === "light"
            ? "rgba(249, 250, 251, 0.5) !important"
            : "#1f2938",
      },
      textarea: {
        border: "1px solid !important",
        borderColor:
          theme.colorScheme === "light"
            ? "#E5E7EB !important"
            : "#384152 !important",
        borderRadius: "8px",
        margin: "8px 0px 0px 0px",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
        backgroundColor: theme.colorScheme === "light" ? "white" : "#384152",
        ":focus": {
          outline: "solid 1px #E85921 !important",
          outlineOffset: "-1px",
        },
      },
    },
    ".sidePanel": {
      border: "1px solid",
      borderColor: theme.colorScheme === "light" ? "#E5E7EB" : "#384152",
      borderLeft: "none",
      borderTopRightRadius: "8px",
      borderBottomRightRadius: "8px",
      background:
        theme.colorScheme === "light"
          ? "linear-gradient(90deg, #F6F6F6, #FFFFFF)"
          : "transparent",
      input: {
        border: "1px solid #E5E7EB !important",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
        backgroundColor: "#ffffff",
        ":focus": {
          outline: "solid 1px #E85921 !important",
          outlineOffset: "-1px",
        },
      },
    },
    ".divider": {
      borderTopWidth: "1px",
      borderTopColor: "rgba(226,232,255,.1)",
      marginBottom: "0.5em",
    },
    ".runPromptButton": {
      borderRadius: "8px",
      border: "1px solid #FDD7AD",
      background: "linear-gradient(180deg, #FEE1C0 0%, #FCC792 100%)",
      boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05)",
      margin: "4px",
      height: "auto",
      color: "#E85921",
      path: {
        color: "#E85921",
      },
      ":hover": {
        background: "linear-gradient(180deg, #FEE1C0 0%, #FF9E3D 100%)",
      },
    },
    ".actionTabsPanel": {
      width: "400px",
    },
    ".logo": {
      maxWidth: "80rem",
      margin: "0 auto",
      padding: "32px 0 0 32px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },

    ".parametersContainer": {
      maxWidth: "1250px",
      maxHeight: "-webkit-fill-available",
      margin: "16px auto",
      padding: "0",
      backgroundColor: theme.colorScheme === "light" ? "#F9FAFB" : "#1f2938",
      borderRadius: "8px",
      border: "1px solid",
      borderColor: theme.colorScheme === "light" ? "#E5E7EB" : "#384152",
      button: {
        ":hover": {
          backgroundColor:
            theme.colorScheme === "light" ? "#F0F1F1" : "transparent",
        },
      },
      input: {
        border: "1px solid !important",
        borderColor:
          theme.colorScheme === "light"
            ? "#E5E7EB !important"
            : "#384152 !important",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
        borderRadius: "8px",
        backgroundColor: theme.colorScheme === "light" ? "white" : "#384152",
        ":focus": {
          outline: "solid 1px #E85921 !important",
          outlineOffset: "-1px",
        },
      },
      textarea: {
        border: "1px solid !important",
        borderColor:
          theme.colorScheme === "light"
            ? "#E5E7EB !important"
            : "#384152 !important",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
        borderRadius: "8px",
        backgroundColor: theme.colorScheme === "light" ? "white" : "#384152",
        ":focus": {
          outline: "solid 1px #E85921 !important",
          outlineOffset: "-1px",
        },
      },
      ".addParameterButton": {
        position: "sticky",
        left: "0",
        bottom: "0",
        margin: "16px 0 0 0",
        background: "linear-gradient(180deg, #FEE1C0 0%, #FCC792 100%)",
        path: {
          color: "#E85921",
        },
      },
    },

    ".mantine-Slider-thumb": {
      border: "0.25rem solid #E85921",
    },
    ".mantine-Slider-bar": {
      backgroundColor: "#E85921",
    },
    ".mantine-Tabs-tab[data-active]": {
      borderBottom: "solid 1px #E85921",
      ":hover": {
        borderBottom: "solid 1px #E85921",
      },
    },
  }),
};
