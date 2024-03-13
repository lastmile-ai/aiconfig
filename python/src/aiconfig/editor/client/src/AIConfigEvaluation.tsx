import { createStyles, MantineProvider } from "@mantine/core";
import EvaluationHeader from "./evaluation/EvaluationHeader";
import { LOCAL_THEME } from "./themes/LocalTheme";
import LocalEditor from "./LocalEditor";

const useStyles = createStyles(() => ({
  editorBackground: {
    background:
      "radial-gradient(ellipse at top,#08122d,#030712),radial-gradient(ellipse at bottom,#030712,#030712)",
    margin: "0 auto",
    minHeight: "100vh",
  },
}));

export default function AIConfigEvaluation() {
  const { classes } = useStyles();
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS theme={LOCAL_THEME}>
      <div className={classes.editorBackground}>
        <EvaluationHeader />
        <LocalEditor />
      </div>
    </MantineProvider>
  );
}
