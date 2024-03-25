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
  globalStyles: (theme) => {
    const inputBorderColor =
      theme.colorScheme === "light" ? "#E5E7EB" : "#384152";
    const inputBackgroundColor =
      theme.colorScheme === "light" ? "white" : "#374151";

    return {
      "div.editorBackground": {
        a: {
          // Change links back to mantine color instead of gradio override
          color: `${
            theme.colorScheme === "light" ? "#1c7ed6" : "#4dabf7"
          } !important`,
        },

        background: theme.colorScheme === "light" ? "white" : "#0b0f19",
        borderRadius: "8px",
        // Gradio component is iframed so height should be in relation to
        // the height of the containing iframe, not the viewport
        height: "100%",
        // Add some margin & padding to better visually separate from surrounding
        // gradio card
        margin: "14px auto 0 auto",
        minHeight: "400px",
        paddingTop: "2px",

        // Apply nested styles on mantine elements for higher specificity
        // than gradio element styles

        /*
         * For all buttons, excluding menu dropdown and .ghost class buttons, apply the gradio color
         * styles
         */
        ".mantine-Button-root.mantine-UnstyledButton-root:not(.ghost):not([aria-haspopup='menu'])":
          {
            background:
              "linear-gradient(to bottom right, #ffedd5, #fdba74 100%)",
            border: "1px solid #fed7aa",
            boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05)",
            color: "#ea580c !important",
            fontSize: "16px" /* var(--button-large-text-size) */,
            fontWeight: 600 /* var(--button-large-text-weight) */,
            minHeight: "36px",
            padding: "0 1.25rem",
          },

        /*
         * Same as above, only on hover
         */
        ".mantine-Button-root.mantine-UnstyledButton-root:not(.ghost):not([aria-haspopup='menu']):hover":
          {
            background: "linear-gradient(to bottom right, #ffedd5, #fed7aa)",
          },

        /*
         * Same as above, only on disabled. See gradio styles for these colors, specifically
         * .secondary[disabled] since .primary doesn't make enough of a contrast
         */
        ".mantine-Button-root.mantine-UnstyledButton-root:not(.ghost):not([aria-haspopup='menu']):disabled":
          {
            background:
              "linear-gradient(to bottom right, #e5e7eb,  #e5e7eb)" /* var(--button-secondary-background-fill-hover) */,
            borderColor:
              "#e5e7eb" /* var(--button-secondary-border-color-hover) */,
            color:
              "#374151 !important" /* var(--button-secondary-text-color-hover) */,
            cursor: "not-allowed",
            pointerEvents:
              "auto" /* mantine sets to disabled, we want the cursor to show per gradio styles */,
          },

        /*
         * For all buttons, excluding menu dropdown, .ghost class buttons, and .runPromptButton, apply
         * this dark text color (from gradio text) so the text can be seen over orange button background
         * regardless of theme
         */
        ".mantine-Button-root.mantine-UnstyledButton-root:not(.ghost):not([aria-haspopup='menu']):not(.runPromptButton)":
          {
            color: "#374151",
          },

        /*
         * Fix loading spinner color for buttons and loaders rendered in buttons
         */
        "button.mantine-Button-root > div.mantine-Button-inner > span.mantine-Button-label > div > svg":
          {
            stroke: "#E85921",
          },

        "button.mantine-Button-root > div.mantine-Button-inner": {
          "span.mantine-Button-centerLoader > svg": {
            stroke: "#E85921",
          },
        },

        "button.mantine-Button-root[data-loading]::before": {
          backgroundColor: "rgba(26, 27, 30, 0.2)",
        },

        ".mantine-Checkbox-root": {
          ".mantine-Checkbox-input": {
            borderColor: inputBorderColor,

            "&:checked": {
              background:
                "linear-gradient(to bottom right, #ffedd5, #fdba74 100%)",
            },
            "&:hover": {
              background: "linear-gradient(to bottom right, #ffedd5, #fed7aa)",
            },
          },

          ".mantine-Checkbox-icon": {
            color: "#E85921",
          },
        },

        ".mantine-Input-input:focus": {
          outline: "solid 1px #E85921 !important",
          outlineOffset: "-1px",
        },

        ".mantine-Input-input":
          theme.colorScheme === "dark"
            ? {
                color: "#C1C2C5",
                backgroundColor: inputBackgroundColor,
              }
            : undefined, // light colorScheme is fine without overrides

        ".mantine-Menu-dropdown": {
          border: `0.0625rem solid ${inputBorderColor}`,
        },

        ".mantine-Slider-bar": {
          backgroundColor: "#E85921",
        },

        ".mantine-Slider-thumb": {
          border: "0.25rem solid #E85921",
          backgroundColor: "#E85921",
        },

        ".mantine-Tabs-tab[data-active]": {
          borderBottom: "solid 1px #E85921",
          ":hover": {
            borderBottom: "solid 1px #E85921",
          },
        },

        ".mantine-Tabs-tabsList": {
          gap: "12px",
        },

        ".mantine-Text-root":
          theme.colorScheme === "dark"
            ? {
                color: "#C1C2C5",
                // default inherited backgroundColor is correct
              }
            : undefined, // light colorScheme is fine without overrides

        ".mantine-TextInput-input[data-with-icon]": {
          paddingLeft: "2.25rem",
        },

        ".mantine-Title-root.mantine-Text-root": {
          fontSize: "2rem",
        },

        ".monoFont": {
          fontFamily:
            "sf mono, ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        },

        ".ghost": {
          input: {
            border: `1px solid ${inputBorderColor}`,
            minHeight: "36px",
            fontFamily:
              "sf mono, ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            borderRadius: "8px",
            margin: "8px 0px 0px 0px",
            backgroundColor: inputBackgroundColor,
            boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
          },
          button: {
            color: theme.colorScheme === "dark" ? "#C1C2C5" : "inherit",
            ":hover": {
              backgroundColor: "transparent",
            },
          },
        },

        ".buttonGroupLeft": {
          borderBottomRightRadius: 0,
          borderTopRightRadius: 0,
        },

        ".buttonGroupRight": {
          borderBottomLeftRadius: 0,
          borderTopLeftRadius: 0,
        },

        ".cellStyle": {
          border: `1px solid ${inputBorderColor}`,
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
            border: `1px solid ${inputBorderColor} !important`,
            borderRadius: "8px",
            margin: "8px 0px 0px 0px",
            boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
            backgroundColor: inputBackgroundColor,
          },

          // Override gradio-container ol styles with mantine's
          ".outputContainer > ol": {
            margin: "1em 0",
            paddingLeft: "40px",
          },
        },

        ".sidePanel": {
          border: `1px solid ${inputBorderColor}`,
          borderLeft: "none",
          borderTopRightRadius: "8px",
          borderBottomRightRadius: "8px",
          background:
            theme.colorScheme === "light"
              ? "linear-gradient(90deg, #F6F6F6, #FFFFFF)"
              : "#0e131f",
          input: {
            border: `1px solid ${inputBorderColor} !important`,
            boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
            backgroundColor: inputBackgroundColor,
            ":focus": {
              outline: "solid 1px #E85921 !important",
              outlineOffset: "-1px",
            },
          },
          textarea: {
            border: `1px solid ${inputBorderColor} !important`,
            boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
            borderRadius: "8px",
            backgroundColor: inputBackgroundColor,
            ":focus": {
              outline: "solid 1px #E85921 !important",
              outlineOffset: "-1px",
            },
          },

          ".promptActionBarClosed": {
            minWidth: "32px",
          },
        },

        ".divider": {
          backgroundColor: inputBorderColor,
          borderTopWidth: "1px",
          borderTopColor: "rgba(226,232,255,.1)",
          marginBottom: "0.5em",
        },

        ".runPromptButton": {
          borderRadius: "8px",
          border: "1px solid #FDD7AD",
          background: "linear-gradient(180deg, #FEE1C0 0%, #FCC792 100%)",
          boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05)",
          margin: "33px 4px 4px 4px",
          padding: "0.625rem !important",
          height: "auto",

          // Make the icon filled when running spinner is shown
          "div.mantine-Button-inner > span.mantine-Button-label > div > svg": {
            fill: "#E85921",
          },
        },

        ".runPromptButton.runPromptButtonReadOnly": {
          marginTop: "13px",
        },

        ".actionTabsPanel": {
          width: "400px",
        },

        ".configMetadataContainer": {
          maxWidth: "1250px",
          maxHeight: "-webkit-fill-available",
          padding: "0",
          backgroundColor:
            theme.colorScheme === "light" ? "#F9FAFB" : "#1f2938",
          borderRadius: "8px",
          border: `1px solid ${inputBorderColor}`,
          button: {
            ":hover": {
              backgroundColor:
                theme.colorScheme === "light" ? "#F0F1F1" : "transparent",
            },
          },
          input: {
            border: `1px solid ${inputBorderColor} !important`,
            boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
            borderRadius: "8px",
            backgroundColor: inputBackgroundColor,
          },
          textarea: {
            border: `1px solid ${inputBorderColor} !important`,
            boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset",
            borderRadius: "8px",
            backgroundColor: inputBackgroundColor,
            ":focus": {
              outline: "solid 1px #E85921 !important",
              outlineOffset: "-1px",
            },
          },
        },

        // Override gradio's button styles
        ".promptMenuButton": {
          marginLeft: "-8px",
          padding: "0 0.875rem",
        },

        ".addParameterButton": {
          position: "sticky",
          left: "0",
          bottom: "0",
          margin: "16px 0 0 0",
          background: "linear-gradient(to bottom right, #ffedd5, #fdba74 100%)",
          border: "1px solid #fed7aa",
          boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.05)",
          color: "#ea580c !important",
          path: {
            color: "#E85921",
          },
          ":hover": {
            background: "linear-gradient(to bottom right, #ffedd5, #fed7aa)",
          },
        },
      },
    };
  },
};
