import { MantineProvider } from "@mantine/core";
import { AIConfigEditorMode } from "../shared/types";
import { LOCAL_THEME } from "./LocalTheme";
import { GRADIO_THEME } from "./GradioTheme";
import ConditionalWrapper from "../components/ConditionalWrapper";
import { useColorScheme } from "@mantine/hooks";
import { useMemo } from "react";

type Props = {
  children: React.ReactNode;
  mode?: AIConfigEditorMode;
};

const THEMES = {
  local: LOCAL_THEME,
  gradio: GRADIO_THEME,
  // TODO: Implement VSCODE_THEME
  vscode: LOCAL_THEME,
};

export default function AIConfigEditorThemeProvider({ children, mode }: Props) {
  const preferredColorScheme = useColorScheme();
  const theme = useMemo(
    () => ({
      colorScheme: preferredColorScheme,
      ...THEMES[mode!],
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
