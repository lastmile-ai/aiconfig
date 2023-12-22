import PromptContainer from "@/src/components/prompt/PromptContainer";
import {
  Container,
  Text,
  Group,
  Button,
  createStyles,
  Stack,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { AIConfig, PromptInput } from "aiconfig";
import router from "next/router";
import { useCallback, useReducer, useState } from "react";
import aiconfigReducer from "@/src/components/aiconfigReducer";
import { ClientAIConfig, clientConfigToAIConfig } from "@/src/shared/types";
import AddPromptButton from "@/src/components/prompt/AddPromptButton";

type Props = {
  aiconfig: ClientAIConfig;
  onBackNavigation: () => void;
  onSave: (aiconfig: AIConfig) => Promise<void>;
};

const useStyles = createStyles((theme) => ({
  addPromptRow: {
    borderRadius: "4px",
    display: "inline-block",
    bottom: -24,
    left: -40,
    "&:hover": {
      backgroundColor:
        theme.colorScheme === "light"
          ? theme.colors.gray[1]
          : "rgba(255, 255, 255, 0.1)",
    },
    [theme.fn.smallerThan("sm")]: {
      marginLeft: "0",
      display: "block",
      position: "static",
      bottom: -10,
      left: 0,
      height: 28,
      margin: "10px 0",
    },
  },
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
      await onSave(clientConfigToAIConfig(aiconfigState));
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
    async (promptIndex: number, newPromptInput: PromptInput) => {
      dispatch({
        type: "UPDATE_PROMPT_INPUT",
        index: promptIndex,
        input: newPromptInput,
      });
      // TODO: Call server-side endpoint to update prompt input
    },
    [dispatch]
  );

  const onUpdatePromptModelSettings = useCallback(
    async (promptIndex: number, newModelSettings: any) => {
      dispatch({
        type: "UPDATE_PROMPT_MODEL_SETTINGS",
        index: promptIndex,
        modelSettings: newModelSettings,
      });
      // TODO: Call server-side endpoint to update model settings
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
            <Stack key={prompt.name}>
              <PromptContainer
                index={i}
                prompt={prompt}
                onChangePromptInput={onChangePromptInput}
                onUpdateModelSettings={onUpdatePromptModelSettings}
                defaultConfigModelName={aiconfigState.metadata.default_model}
              />
              <div className={classes.addPromptRow}>
                <AddPromptButton />
              </div>
            </Stack>
          );
        })}
      </Container>
    </>
  );
}
