import { MantineThemeOverride } from "@mantine/core";

export const LOCAL_THEME: MantineThemeOverride = {
  colorScheme: "dark",

  headings: {
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, Arial, sans-serif",
    sizes: {
      h1: { fontSize: "2rem" },
    },
  },

  defaultGradient: {
    from: "pink",
    to: "pink",
    deg: 45,
  },
  // local editor theme
  globalStyles: () => ({
    ".editorBackground": {
      background:
        "radial-gradient(ellipse at top,#08122d,#030712),radial-gradient(ellipse at bottom,#030712,#030712)",
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
      border: "1px solid rgba(226,232,255,.1) !important",
      background: "rgb(12 21 57 / 10%)",
      flex: 1,
      borderTopRightRadius: "0px",
      borderBottomRightRadius: "0px",
      ":hover": {
        background: "rgba(255, 255, 255, 0.03) !important",
      },
      textarea: {
        border: "1px solid rgba(226,232,255,.1)",
        backgroundColor: "#060c21",
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
      border: "1px solid rgba(226,232,255,.1)",
      borderLeft: "none",
      borderTopRightRadius: "4px",
      borderBottomRightRadius: "4px",
      input: {
        border: "1px solid rgba(226,232,255,.1)",
        backgroundColor: "#060c21",
        ":focus": {
          outline: "solid 1px #ff1cf7 !important",
          outlineOffset: "-1px",
        },
      },
      textarea: {
        border: "1px solid rgba(226,232,255,.1)",
        backgroundColor: "#060c21",
        ":focus": {
          outline: "solid 1px #ff1cf7 !important",
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
      background: "#ff1cf7",
      color: "white",
      height: "auto",
      "&:hover": {
        background: "#ff46f8",
      },
    },
    ".actionTabsPanel": {
      width: "400px",
    },

    ".parametersContainer": {
      maxWidth: "1250px",
      maxHeight: "-webkit-fill-available",
      margin: "16px auto",
      padding: "0",
      backgroundColor: "rgba(226,232,255,.1)",
      borderRadius: "4px",
      border: "1px solid rgba(226,232,255,.1) !important",
      button: {
        ":hover": {
          backgroundColor: "rgba(226,232,255,.1)",
        },
      },
      input: {
        border: "1px solid rgba(226,232,255,.1)",
        backgroundColor: "#060c21",
        borderRadius: "4px",
        ":focus": {
          outline: "solid 1px #ff1cf7 !important",
          outlineOffset: "-1px",
        },
      },
      textarea: {
        border: "1px solid rgba(226,232,255,.1)",
        backgroundColor: "#060c21",
        borderRadius: "4px",
        ":focus": {
          outline: "solid 1px #ff1cf7 !important",
          outlineOffset: "-1px",
        },
      },
    },
    ".addParameterButton": {
      position: "sticky",
      left: "0",
      bottom: "0",
      margin: "16px 0 0 0",
      background: "#ff1cf7",
      "&:hover": {
        background: "#ff46f8",
      },
    },
    ".mantine-Slider-thumb": {
      border: "0.25rem solid #ff1cf7",
      backgroundColor: "white",
    },
    ".mantine-Slider-bar": {
      backgroundColor: "#ff1cf7",
    },
    ".mantine-Tabs-tab[data-active]": {
      borderBottom: "solid 1px #ff1cf7",
      ":hover": {
        borderBottom: "solid 1px #ff1cf7",
      },
    },
  }),
};
