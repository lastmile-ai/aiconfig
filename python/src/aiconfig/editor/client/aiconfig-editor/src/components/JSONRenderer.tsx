import { Prism } from "@mantine/prism";
import { JSONObject, JSONValue } from "aiconfig";
import { memo, useContext } from "react";
import JSONEditor from "./JSONEditor";
import AIConfigContext from "../contexts/AIConfigContext";

type Props = {
  content: JSONValue;
  onChange?: (value: JSONValue) => void;
  schema?: JSONObject;
};

export default memo(function JSONRenderer({
  content,
  onChange,
  schema,
}: Props) {
  const { readOnly } = useContext(AIConfigContext);
  // Prism is a read only renderer.
  return !onChange || readOnly ? (
    <Prism language="json" styles={{ code: { textWrap: "pretty" } }}>
      {JSON.stringify(content, null, 2)}
    </Prism>
  ) : (
    <JSONEditor content={content} onChangeContent={onChange} schema={schema} />
  );
});
