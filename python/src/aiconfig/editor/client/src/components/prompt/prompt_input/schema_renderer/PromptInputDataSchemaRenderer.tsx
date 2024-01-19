import { PromptInputObjectDataSchema } from "../../../../utils/promptUtils";
import { Spoiler, Textarea } from "@mantine/core";
import { JSONValue } from "aiconfig";
import { memo, useContext } from "react";
import AIConfigContext from "../../../../contexts/AIConfigContext";
import { TextRenderer } from "../../TextRenderer";

type Props = {
  schema: PromptInputObjectDataSchema;
  data?: JSONValue;
  onChangeData: (value: JSONValue) => void;
};

export default memo(function PromptInputDataSchemaRenderer({ schema, data, onChangeData }: Props) {
  const { readOnly } = useContext(AIConfigContext);

  switch (schema.type) {
    case "string": {
      const valueData = data ? (data as string) : "";
      return readOnly ? (
        <div style={{ padding: "0.5em" }}>
          <Spoiler maxHeight={200} showLabel="Show more" hideLabel="Hide" initialState={false} transitionDuration={300}>
            <TextRenderer content={valueData} />
          </Spoiler>
        </div>
      ) : (
        <Textarea
          value={valueData}
          onChange={(e) => onChangeData(e.target.value)}
          disabled={readOnly}
          placeholder={readOnly ? "" : "Type a prompt"}
        />
      );
    }
    default:
      return null; // TODO: Handle other input.data types
  }
});
