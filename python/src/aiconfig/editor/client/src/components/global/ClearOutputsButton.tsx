import { Button } from "@mantine/core";
import { memo, useContext } from "react";

import AIConfigContext from "../../contexts/AIConfigContext";

type Props = {
  onClearOutputs: () => void;
};

export default memo(function ClearOutputsButton({ onClearOutputs }: Props) {
  const { readOnly } = useContext(AIConfigContext);

  return readOnly ? (
    <Button disabled size="xs" variant="gradient">
      Clear Outputs
    </Button>
  ) : (
    <Button
      loading={undefined}
      onClick={onClearOutputs}
      size="xs"
      variant="gradient"
    >
      Clear Outputs
    </Button>
  );
});
