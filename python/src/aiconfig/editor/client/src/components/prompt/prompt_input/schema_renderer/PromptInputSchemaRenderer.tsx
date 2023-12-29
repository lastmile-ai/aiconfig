import {
  PromptInputObjectSchema,
  PromptInputSchema,
} from "../../../../utils/promptUtils";
import DataRenderer from "./PromptInputDataSchemaRenderer";
import AttachmentsRenderer from "./PromptInputAttachmentsSchemaRenderer";
import { Flex, Textarea } from "@mantine/core";
import { Attachment, JSONValue, PromptInput } from "aiconfig";
import { memo } from "react";

type Props = {
  input: PromptInput;
  schema: PromptInputSchema;
  onChangeInput: (value: PromptInput) => void;
};

type SchemaRendererProps = Props & {
  schema: PromptInputObjectSchema;
};

function SchemaRenderer({ input, schema, onChangeInput }: SchemaRendererProps) {
  const {
    data: dataSchema,
    attachments: attachmentsSchema,
    ..._restProperties
  } = schema.properties;

  if (typeof input === "string") {
    return null;
    // TODO: Add ErrorBoundary handling and throw error here
  }

  const { data, attachments, ..._restData } = input;

  const onChangeData = (value: JSONValue) => {
    onChangeInput({ ...input, data: value });
  };

  const onChangeAttachments = (value: Attachment[]) => {
    onChangeInput({ ...input, attachments: value });
  };

  return (
    <Flex direction="column">
      <DataRenderer
        schema={dataSchema}
        data={data}
        onChangeData={onChangeData}
      />
      {attachmentsSchema && (
        <AttachmentsRenderer
          schema={attachmentsSchema}
          onChangeAttachments={onChangeAttachments}
          attachments={attachments}
        />
      )}
      {/* <JSONRenderer properties={restProperties} data={restData}/> */}
    </Flex>
  );
}

export default memo(function PromptInputSchemaRenderer(props: Props) {
  if (props.schema.type === "string") {
    // TODO: Add ErrorBoundary handling
    // if (props.input && typeof props.input !== "string") {
    //   throw new Error(
    //     `Expected input to be a string, but got ${typeof props.input}`
    //   );
    // }
    return (
      <Textarea
        value={props.input as string}
        onChange={(e) => props.onChangeInput(e.target.value)}
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
