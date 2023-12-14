import { PromptInputObjectDataSchema } from "@/src/utils/promptUtils";
import { Textarea } from "@mantine/core";
import { JSONValue } from "aiconfig/dist/common";
import { memo } from "react";

type Props = {
  schema: PromptInputObjectDataSchema;
  data?: JSONValue;
  onChangeData: (value: JSONValue) => void;
};

export default memo(function PromptInputDataSchemaRenderer({
  schema,
  data,
  onChangeData,
}: Props) {
  switch (schema.type) {
    case "string":
      return (
        <Textarea
          value={data ? (data as string) : ""}
          onChange={(e: any) => onChangeData(e.target.value)}
        />
      );
    default:
      return null; // TODO: Handle other input.data types
  }
});
