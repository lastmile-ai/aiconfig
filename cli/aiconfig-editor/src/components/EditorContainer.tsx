import { Container, Text, Group, Button, Textarea } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { AIConfig } from "aiconfig";
import router from "next/router";
import { useCallback, useState } from "react";

type CellProps = {
  index: number;
  prompt: {
    name: string;
    input: string; // TODO: Should this be | string[] and something else too?
    metadata: any;
  };
  onChangePrompt: (i: number, newPrompt: string) => void;
};

function CellEditor({ prompt, index, onChangePrompt }: CellProps) {
  // TODO: Show prompt name & metadata inside of settings editor later

  return (
    <div style={{ marginTop: 16 }}>
      <Group style={{ float: "right" }} m="sm">
        <Text>{prompt.name}</Text>
        <Button>Settings</Button>
      </Group>
      <Textarea
        value={prompt.input}
        onChange={(e: any) => onChangePrompt(index, e.target.value)}
      />
    </div>
  );
}

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

  const onChangePrompt = useCallback(
    (i: number, newPrompt: string) => {
      // TODO: This is super basic, should probably update to reducer, etc.
      // Also not optimized, etc.

      const newPrompts = [...aiconfig.prompts];
      newPrompts[i].input = newPrompt;
      setAIConfig({ ...aiconfig, prompts: newPrompts });
    },
    [aiconfig]
  );

  // TODO: Add new prompt button

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
            <CellEditor
              index={i}
              prompt={prompt}
              key={i}
              onChangePrompt={onChangePrompt}
            />
          );
        })}
      </Container>
    </>
  );
}
