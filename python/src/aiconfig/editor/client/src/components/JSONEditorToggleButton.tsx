import { ActionIcon, Tooltip } from "@mantine/core";
import { IconBraces, IconBracesOff } from "@tabler/icons-react";
import AIConfigContext from "../contexts/AIConfigContext";
import { useContext } from "react";

type Props = {
  isRawJSON: boolean;
  setIsRawJSON: (value: boolean) => void;
};

export default function JSONEditorToggleButton({
  isRawJSON,
  setIsRawJSON,
}: Props) {
  const { readOnly } = useContext(AIConfigContext);

  const toggleJSONButtonLabel = !readOnly ? "Toggle JSON editor" : "View JSON";
  return (
    <Tooltip label={toggleJSONButtonLabel} withArrow>
      <ActionIcon onClick={() => setIsRawJSON(!isRawJSON)}>
        {isRawJSON ? <IconBracesOff size="1rem" /> : <IconBraces size="1rem" />}
      </ActionIcon>
    </Tooltip>
  );
}
