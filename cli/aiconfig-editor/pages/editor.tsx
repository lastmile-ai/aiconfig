import { Container, Text, Group, Button, Textarea } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { ufetch } from "ufetch";

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

export default function Editor() {
  // Use router to get the path, load the file using aicnofig.load, make it editable & use save to save it regularly
  // TODO: Settings, other things to edit, allowing plugins in editor (eg for custom model parsers in python or JS)
  const router = useRouter();

  const [aiconfig, setAiConfig] = useState<any>({ prompts: [] });
  const [loading, setLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!router.query.path) {
      return;
    }

    const res = await ufetch.post(`/api/aiconfig/load`, {
      path: router.query.path,
    });

    setAiConfig(res.aiconfig);
  }, [router]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const back = useCallback(() => {
    if (!router.query.path) {
      return;
    } else {
      router.back();
    }
  }, [router]);

  const save = useCallback(async () => {
    // Save new aiconfig - also need to specify path; also handle errors, etc.

    setLoading(true);
    try {
      const res = await ufetch.post(`/api/aiconfig/save`, {
        path: router.query.path,
        aiconfig,
      });
    } catch (err: any) {
      showNotification({
        title: "Error saving",
        message: err.message,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, [aiconfig, router]);

  const onChangePrompt = useCallback(
    (i: number, newPrompt: string) => {
      // TODO: This is super basic, should probably update to reducer, etc.
      // Also not optimized, etc.

      const newPrompts = [...aiconfig.prompts];
      newPrompts[i].input = newPrompt;
      setAiConfig({ ...aiconfig, prompts: newPrompts });
    },
    [aiconfig]
  );

  // TODO: Add new prompt button

  return (
    <div>
      <Container>
        <Group grow m="sm">
          <Button onClick={back} variant="default" mr="lg">
            Back
          </Button>
          <Text sx={{ textOverflow: "ellipsis", overflow: "hidden" }} size={14}>
            {router.query?.path || "No path specified"}
          </Text>
          <Button loading={loading} ml="lg" onClick={save}>
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
      {/* <Container>{JSON.stringify(aiconfig, null, 2)}</Container> */}
    </div>
  );
}
