import { PromptInputObjectDataSchema } from "../../../../utils/promptUtils";
import { Textarea } from "@mantine/core";
import { JSONValue } from "aiconfig";
import { memo, useContext } from "react";
import AIConfigContext from "../../../../contexts/AIConfigContext";

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
  const {readOnly} = useContext(AIConfigContext);
  
  switch (schema.type) {
    case "string":
      return (
        <Textarea
          value={data ? (data as string) : ""}
          onChange={(e) => onChangeData(e.target.value)}
          disabled={readOnly}
          placeholder="Type a prompt"
        />
      );
    default:
      return null; // TODO: Handle other input.data types
  }
});
