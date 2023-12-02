import {
  PromptInputObjectSchema,
  PromptInputSchema,
} from "@/src/utils/promptUtils";
import { Flex, Textarea } from "@mantine/core";
import { PromptInput } from "aiconfig";
import { memo } from "react";

type Props = {
  input: PromptInput;
  schema: PromptInputSchema;
  onChangeInput: (value: PromptInput) => void;
};

type SchemaRendererProps = Props & {
  schema: PromptInputObjectSchema;
};

function DataRenderer() {
  return null;
}

function AttachmentsRenderer() {
  return null;
}

function SchemaRenderer({ input, schema, onChangeInput }: SchemaRendererProps) {
  const { data, attachments, ...restProperties } = schema.properties;
  return (
    <Flex>
      <DataRenderer />
      <AttachmentsRenderer />
    </Flex>
  );
}

export default memo(function PromptInputSchemaRenderer(props: Props) {
  if (props.schema.type === "string") {
    return (
      <Textarea
        value={props.input as string}
        onChange={(e: any) => props.onChangeInput(e.target.value)}
      />
    );
  } else {
    return (
      <SchemaRenderer
        {...props}
        schema={props.schema as PromptInputObjectSchema}
      />
    );
  }
});
