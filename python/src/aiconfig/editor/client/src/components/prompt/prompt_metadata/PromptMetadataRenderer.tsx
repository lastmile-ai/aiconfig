import { ClientPrompt } from "../../../shared/types";
import { GenericPropertiesSchema } from "../../../utils/promptUtils";
import { memo } from "react";

type Props = {
  prompt: ClientPrompt;
  schema?: GenericPropertiesSchema;
};

function ModelMetadataConfigRenderer(_props: Props) {
  return null; // TODO: Implement
}

function ModelMetadataSchemaRenderer(_props: Props) {
  return null; // TODO: Implement
}

export default memo(function PromptMetadataRenderer({ prompt, schema }: Props) {
  return schema ? (
    <ModelMetadataSchemaRenderer prompt={prompt} schema={schema} />
  ) : (
    <ModelMetadataConfigRenderer prompt={prompt} />
  );
});
