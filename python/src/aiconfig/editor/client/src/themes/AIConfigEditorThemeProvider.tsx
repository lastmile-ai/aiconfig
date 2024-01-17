import { MantineProvider } from "@mantine/core";
import { AIConfigEditorMode } from "../shared/types";
import { LOCAL_THEME } from "./LocalTheme";
import { GRADIO_THEME } from "./GradioTheme";

type Props = {
  children: React.ReactNode;
  mode: AIConfigEditorMode;
};

const THEMES = {
  local: LOCAL_THEME,
  gradio: GRADIO_THEME,
  // TODO: Implement VSCODE_THEME
  vscode: LOCAL_THEME,
};

export default function AIConfigEditorThemeProvider({ children, mode }: Props) {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS theme={THEMES[mode]}>
      {children}
    </MantineProvider>
  );
}
