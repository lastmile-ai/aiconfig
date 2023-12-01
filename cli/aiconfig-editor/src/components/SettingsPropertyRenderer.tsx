import { Flex } from "@mantine/core";
import { memo } from "react";

type Props = {
  propertyName: string;
  property: { [key: string]: any };
  isRequired?: boolean;
  initialValue: any;
};

export default memo(function SettingsPropertyRenderer({
  propertyName,
  property,
  isRequired = false,
  initialValue,
}: Props) {
  return (
    <Flex direction="column">
      <div>{propertyName}</div>
      <div>{JSON.stringify(property)}</div>
      <div>isRequired: {JSON.stringify(isRequired)}</div>
      <div>initialValue: {JSON.stringify(initialValue)}</div>
    </Flex>
  );
});
