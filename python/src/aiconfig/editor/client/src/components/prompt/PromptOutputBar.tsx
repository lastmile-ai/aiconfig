import { Divider, Flex, Text } from "@mantine/core";
import { memo } from "react";

type Props = {};

export default memo(function PromptOutputBar(_props: Props) {
  return (
    <Flex direction="column" mt="0.5em">
      <Divider size="sm" mt="0.5em" mb="0.5em" />
      <Text color="dimmed">Output</Text>
      {/* TODO: Add output metrics */}
    </Flex>
  );
});
