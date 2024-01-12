import { ClientPrompt } from "../../../shared/types";
import { GenericPropertiesSchema } from "../../../utils/promptUtils";
import { memo } from "react";

type Props = {
  prompt: ClientPrompt;
  schema?: GenericPropertiesSchema;
};

function ModelMetadataConfigRenderer({ prompt }: Props) {
  return null; // TODO: Implement
}

function ModelMetadataSchemaRenderer({ prompt, schema }: Props) {
  return null; // TODO: Implement
}

export default memo(function PromptMetadataRenderer({ prompt, schema }: Props) {
  return schema ? (
    <ModelMetadataSchemaRenderer prompt={prompt} schema={schema} />
  ) : (
    <ModelMetadataConfigRenderer prompt={prompt} />
  );
});
