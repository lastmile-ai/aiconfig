import { JSONValue } from "aiconfig";
import { memo } from "react";
import JSONRenderer from "../../JSONRenderer";

export default memo(function JSONOutput({ content }: { content: JSONValue }) {
  return <JSONRenderer content={content} />;
});
