//import { fetcher } from "@/src/helpers/client/swrUtils";
import {
  ActionIcon,
  Button,
  createStyles,
  Flex,
  Menu,
  Text,
  TextInput,
} from "@mantine/core";
import { IconPlus, IconSearch, IconTextCaption } from "@tabler/icons-react";
import { memo, useCallback, useContext, useState } from "react";
//import useSWR from "swr";

type Props = {};

function ModelMenuItems({ models }: { models: string[] }) {
  return models.map((model) => (
    <Menu.Item key={model} icon={<IconTextCaption size="16" />}>
      {model}
    </Menu.Item>
  ));
}

export default memo(function AddPromptButton(props: Props) {
  const models = ["GPT-4V"];
  return (
    <Menu position="bottom-start">
      <Menu.Target>
        <ActionIcon>
          <IconPlus size={20} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <TextInput icon={<IconSearch size="16" />} placeholder="Search" />
        <ModelMenuItems models={models} />
        <Menu.Divider />
        <Menu.Item icon={<IconPlus size="16" />}>Add New Model</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
});
