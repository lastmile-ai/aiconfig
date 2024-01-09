import { ActionIcon, Tooltip } from "@mantine/core";
import { IconBraces, IconBracesOff } from "@tabler/icons-react";

type Props = {
  isRawJSON: boolean;
  setIsRawJSON: (value: boolean) => void;
};

export default function JSONEditorToggleButton({
  isRawJSON,
  setIsRawJSON,
}: Props) {
  return (
    <Tooltip label="Toggle JSON editor" withArrow>
      <ActionIcon onClick={() => setIsRawJSON(!isRawJSON)}>
        {isRawJSON ? <IconBracesOff size="1rem" /> : <IconBraces size="1rem" />}
      </ActionIcon>
    </Tooltip>
  );
}
