import { PromptMetadataSchema } from "@/src/utils/promptUtils";
import { Prompt } from "aiconfig";
import { memo } from "react";

type Props = {
  prompt: Prompt;
  schema?: PromptMetadataSchema;
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
