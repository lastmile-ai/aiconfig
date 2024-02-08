import { MantineProvider, MantineThemeOverride } from "@mantine/core";
import { AIConfigEditorMode, ThemeMode } from "../shared/types";
import { LOCAL_THEME } from "./LocalTheme";
import { GRADIO_THEME } from "./GradioTheme";
import { VSCODE_THEME } from "./VSCodeTheme";
import ConditionalWrapper from "../components/ConditionalWrapper";
import { useColorScheme } from "@mantine/hooks";
import { useMemo } from "react";

type Props = {
  children: React.ReactNode;
  mode?: AIConfigEditorMode;
  themeMode?: ThemeMode;
  themeOverride?: MantineThemeOverride;
};

const THEMES = {
  local: LOCAL_THEME,
  gradio: GRADIO_THEME,
  vscode: VSCODE_THEME,
};

export default function AIConfigEditorThemeProvider({
  children,
  mode,
  themeMode,
  themeOverride,
}: Props) {
  // Use system color scheme by default (don't conditionally call hooks!)
  let preferredColorScheme = useColorScheme();
  if (themeMode) {
    // if provided, themeMode overrides system color scheme
    preferredColorScheme = themeMode;
  }

  const theme = useMemo(
    () => ({
      colorScheme: preferredColorScheme,
      ...(themeOverride ?? (mode ? THEMES[mode] : {})),
    }),
    [mode, preferredColorScheme, themeOverride]
  );

  return (
    <ConditionalWrapper
      condition={mode != null || themeMode != null || themeOverride != null}
      wrapper={(children) => (
        <MantineProvider withGlobalStyles withNormalizeCSS theme={theme}>
          {children}
        </MantineProvider>
      )}
    >
      {children}
    </ConditionalWrapper>
  );
}
