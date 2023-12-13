import { JSONObject } from "aiconfig/dist/common";
import { memo } from "react";

type Props = {
  settings: JSONObject;
};

export default memo(function ModelSettingsConfigRenderer({ settings }: Props) {
  return <div>{JSON.stringify(settings)}</div>;
});
