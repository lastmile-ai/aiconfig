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
  let renderer = null;

  if (!onChange || readOnly) {
    if (content != null) {
      // Prism is a read only renderer, but requires a string input. Just render
      // null if the content is empty in readonly
      renderer = (
        <Prism language="json" styles={{ code: { textWrap: "pretty" } }}>
          {JSON.stringify(content, null, 2)}
        </Prism>
      );
    }
  } else {
    renderer = (
      <JSONEditor
        content={content}
        onChangeContent={onChange}
        schema={schema}
      />
    );
  }

  return renderer;
});
