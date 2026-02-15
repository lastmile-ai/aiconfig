import {
  CopyButton as MantineCopyButton,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";

type Props = {
  value: string;
  contentLabel?: string;
};
export default function CopyButton({ value, contentLabel }: Props) {
  const labelSuffix = contentLabel ? ` ${contentLabel}` : "";
  return (
    <MantineCopyButton value={value} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip
          label={copied ? `Copied${labelSuffix}` : `Copy${labelSuffix}`}
          withArrow
        >
          <ActionIcon color={copied ? "teal" : "gray"} onClick={copy}>
            {copied ? <IconCheck size="1rem" /> : <IconCopy size="1rem" />}
          </ActionIcon>
        </Tooltip>
      )}
    </MantineCopyButton>
  );
}
