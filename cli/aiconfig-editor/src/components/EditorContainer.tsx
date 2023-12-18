import PromptContainer from "@/src/components/prompt/PromptContainer";
import { Container, Text, Group, Button, createStyles } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { AIConfig, PromptInput } from "aiconfig";
import router from "next/router";
import { useCallback, useReducer, useState } from "react";
import aiconfigReducer from "@/src/components/aiconfigReducer";

type Props = {
  aiconfig: AIConfig;
  onBackNavigation: () => void;
  onSave: (aiconfig: AIConfig) => Promise<void>;
};

const useStyles = createStyles((theme) => ({
  promptsContainer: {
    [theme.fn.smallerThan("sm")]: {
      padding: "0 0 200px 0",
    },
    paddingBottom: 400,
  },
}));

export default function EditorContainer({
  aiconfig: initialAIConfig,
  onBackNavigation,
  onSave,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [aiconfigState, dispatch] = useReducer(
    aiconfigReducer,
    initialAIConfig
  );

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(aiconfigState);
    } catch (err: any) {
      showNotification({
        title: "Error saving",
        message: err.message,
        color: "red",
      });
    } finally {
      setIsSaving(false);
    }
  }, [aiconfigState, onSave]);

  const onChangePromptInput = useCallback(
    (i: number, newPromptInput: PromptInput) => {
      dispatch({
        type: "UPDATE_PROMPT_INPUT",
        index: i,
        input: newPromptInput,
      });
    },
    [dispatch]
  );

  const { classes } = useStyles();

  // TODO: Implement editor context for callbacks, readonly state, etc.

  return (
    <>
      <Container maw="80rem">
        <Group grow m="sm">
          <Button onClick={onBackNavigation} variant="default" mr="lg">
            Back
          </Button>
          <Text sx={{ textOverflow: "ellipsis", overflow: "hidden" }} size={14}>
            {router.query?.path || "No path specified"}
          </Text>
          <Button loading={isSaving} ml="lg" onClick={save}>
            Save
          </Button>
        </Group>
      </Container>
      <Container maw="80rem" className={classes.promptsContainer}>
        {aiconfigState.prompts.map((prompt: any, i: number) => {
          return (
            <PromptContainer
              index={i}
              prompt={prompt}
              key={prompt.name}
              onChangePromptInput={onChangePromptInput}
              defaultConfigModelName={aiconfigState.metadata.default_model}
            />
          );
        })}
      </Container>
    </>
  );
}
