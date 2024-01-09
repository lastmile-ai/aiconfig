import { Prism } from "@mantine/prism";
import { JSONObject, JSONValue } from "aiconfig";
import { memo } from "react";
import JSONEditor from "./JSONEditor";

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
  return !onChange ? (
    <Prism language="json" styles={{ code: { textWrap: "pretty" } }}>
      {JSON.stringify(content, null, 2)}
    </Prism>
  ) : (
    <JSONEditor content={content} onChangeContent={onChange} schema={schema} />
  );
});
