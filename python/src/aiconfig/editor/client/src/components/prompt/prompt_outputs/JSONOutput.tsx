import { Prism } from "@mantine/prism";
import { JSONValue } from "aiconfig";
import { memo } from "react";

export default memo(function JSONOutput({ content }: { content: JSONValue }) {
  return (
    <Prism language="json" styles={{ code: { textWrap: "pretty" } }}>
      {JSON.stringify(content, null, 2)}
    </Prism>
  );
});
