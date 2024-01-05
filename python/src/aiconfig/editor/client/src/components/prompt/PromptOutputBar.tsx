import { Divider, Flex, Text } from "@mantine/core";
import { memo } from "react";

export default memo(function PromptOutputBar() {
  return (
    <Flex direction="column" mt="0.5em">
      <Divider size="sm" className="divider" />
      <Text color="dimmed" size={"xs"} className="monoFont">
        Output
      </Text>
      {/* TODO: Add output metrics */}
    </Flex>
  );
});
