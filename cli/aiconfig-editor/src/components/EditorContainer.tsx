import PromptContainer from "@/src/components/prompt/PromptContainer";
import { Container, Text, Group, Button } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { AIConfig, PromptInput } from "aiconfig";
import router from "next/router";
import { useCallback, useState } from "react";

type Props = {
  aiconfig: AIConfig;
  onBackNavigation: () => void;
  onSave: (aiconfig: AIConfig) => Promise<void>;
};

export default function EditorContainer({
  aiconfig: initialAIConfig,
  onBackNavigation,
  onSave,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [aiconfig, setAIConfig] = useState(initialAIConfig);

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(aiconfig);
    } catch (err: any) {
      showNotification({
        title: "Error saving",
        message: err.message,
        color: "red",
      });
    } finally {
      setIsSaving(false);
    }
  }, [aiconfig, onSave]);

  // TODO: Move to EditorContext and update to handle non-text inputs
  const onChangePromptInput = useCallback(
    (i: number, newPromptInput: PromptInput) => {
      // TODO: This is super basic, should probably update to reducer, etc.
      // Also not optimized, etc.

      const newPrompts = [...aiconfig.prompts];
      newPrompts[i].input = newPromptInput;
      setAIConfig({ ...aiconfig, prompts: newPrompts });
    },
    [aiconfig]
  );

  return (
    <>
      <Container>
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
      <Container>
        {aiconfig.prompts.map((prompt: any, i: number) => {
          return (
            <PromptContainer
              index={i}
              prompt={prompt}
              key={prompt.name}
              onChangePromptInput={onChangePromptInput}
              defaultConfigModelName={aiconfig.metadata.default_model}
            />
          );
        })}
      </Container>
    </>
  );
}
