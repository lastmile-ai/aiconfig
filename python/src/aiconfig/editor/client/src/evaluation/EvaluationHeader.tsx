import {
  Button,
  Container,
  Flex,
  Group,
  MultiSelect,
  Tooltip,
} from "@mantine/core";
import { useState } from "react";

const METRIC_IDS = ["accuracy", "f1", "precision", "recall"];

export default function EvaluationHeader() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const isEvalDisabled = selectedMetrics.length === 0;

  return (
    <Container maw="80rem">
      <Flex justify="flex-end" pt="md" mb="xs">
        <Group spacing="xs">
          <MultiSelect
            data={METRIC_IDS}
            placeholder="Select metrics"
            onChange={setSelectedMetrics}
          />
          <Tooltip
            label={
              isEvalDisabled
                ? "Select metrics to evaluate"
                : "Evaluate the prompts with the selected metrics"
            }
          >
            <div>
              <Button disabled={isEvalDisabled}>Evaluate</Button>
            </div>
          </Tooltip>
        </Group>
      </Flex>
    </Container>
  );
}
