import { MantineProvider } from "@mantine/core";
import { AIConfigEditorMode, ThemeMode } from "../shared/types";
import { LOCAL_THEME } from "./LocalTheme";
import { GRADIO_THEME } from "./GradioTheme";
import ConditionalWrapper from "../components/ConditionalWrapper";
import { useColorScheme } from "@mantine/hooks";
import { useMemo } from "react";

type Props = {
  children: React.ReactNode;
  mode?: AIConfigEditorMode;
  themeMode?: ThemeMode;
};

const THEMES = {
  local: LOCAL_THEME,
  gradio: GRADIO_THEME,
  // TODO: Implement VSCODE_THEME
  vscode: LOCAL_THEME,
};

export default function AIConfigEditorThemeProvider({
  children,
  mode,
  themeMode,
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
      ...THEMES[
        mode!
      ] /* mode must be nonnull per conditional wrapper condition */,
    }),
    [mode, preferredColorScheme]
  );

  return (
    <ConditionalWrapper
      condition={mode != null}
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
