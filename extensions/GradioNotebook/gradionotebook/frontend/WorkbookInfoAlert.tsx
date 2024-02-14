import { Alert, Anchor, Text, createStyles } from "@mantine/core";
import { memo, useState } from "react";

// Hacky, but we need to explicitly set mantine style here since gradio overrides
// with `.gradio-container-id a` specificity for anchor elements.
// See mantine-color-anchor definition in
// https://github.com/mantinedev/mantine/blob/d1f047bd523f8f36ab9edf3aff5f6c2948736c5a/packages/%40mantine/core/src/core/MantineProvider/global.css#L353
// TODO: Remove once overall style problem is fixed
const useStyles = createStyles((theme) => ({
  link: {
    color: `${
      theme.colorScheme === "dark" ? theme.colors.blue[4] : theme.primaryColor
    } !important`,
  },
}));

export default memo(function WorkbookInfoAlert() {
  const { classes } = useStyles();
  const [isAlertVisible, setIsAlertVisible] = useState<boolean>(true);

  return (
    <Alert
      color="blue"
      hidden={!isAlertVisible}
      mb="8px"
      onClose={() => setIsAlertVisible(false)}
      withCloseButton
    >
      <Text>
        This is a{" "}
        <Anchor
          href="https://aiconfig.lastmileai.dev/docs/gradio-notebook"
          target="_blank"
          className={classes.link}
        >
          Gradio Notebook
        </Anchor>{" "}
        space.{" "}
        <Anchor
          href="https://huggingface.co/docs/hub/en/spaces-overview#duplicating-a-space"
          target="_blank"
          className={classes.link}
        >
          Duplicate
        </Anchor>{" "}
        the space to build your own!
      </Text>
    </Alert>
  );
});
