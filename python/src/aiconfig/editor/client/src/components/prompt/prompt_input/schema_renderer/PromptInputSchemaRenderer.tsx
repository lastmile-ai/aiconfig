import {
  PromptInputObjectSchema,
  PromptInputSchema,
} from "../../../../utils/promptUtils";
import DataRenderer from "./PromptInputDataSchemaRenderer";
import AttachmentsRenderer from "./PromptInputAttachmentsSchemaRenderer";
import { Flex, Spoiler, Text, Textarea } from "@mantine/core";
import { Attachment, JSONValue, PromptInput } from "aiconfig";
import { memo, useContext } from "react";
import JSONRenderer from "../../../JSONRenderer";
import AIConfigContext from "../../../../contexts/AIConfigContext";
import { TextRenderer } from "../../TextRenderer";

type Props = {
  input: PromptInput;
  schema: PromptInputSchema;
  onChangeInput: (value: PromptInput) => void;
  cancelRun: () => Promise<void>;
  runPrompt: () => Promise<void>;
  isRunning?: boolean;
  runDisabled?: boolean;
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
    throw new Error("Expected input type object but got string");
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
      {dataSchema && (
        <DataRenderer
          schema={dataSchema}
          data={data}
          onChangeData={onChangeData}
        />
      )}
      {attachmentsSchema && (
        <AttachmentsRenderer
          schema={attachmentsSchema}
          onChangeAttachments={onChangeAttachments}
          attachments={attachments ?? []}
        />
      )}
      {/* <JSONRenderer properties={restProperties} data={restData}/> */}
    </Flex>
  );
}

export default memo(function PromptInputSchemaRenderer(props: Props) {
  const { readOnly } = useContext(AIConfigContext);

  if (props.schema.type === "string") {
    if (props.input && typeof props.input !== "string") {
      return (
        <>
          <Text color="red">Expected input type string</Text>
          <JSONRenderer content={props.input} />
        </>
      );
    }
    return readOnly ? (
      <div style={{ padding: "0.5em" }}>
        <Spoiler
          maxHeight={200}
          showLabel="Show more"
          hideLabel="Hide"
          initialState={false}
          transitionDuration={300}
        >
          <TextRenderer content={props.input as string} />
        </Spoiler>
      </div>
    ) : (
      <Textarea
        value={props.input}
        label="Prompt"
        onChange={(e) => props.onChangeInput(e.target.value)}
        placeholder="Type a prompt"
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.shiftKey || event.ctrlKey)) {
            event.preventDefault();
            if (!props.runDisabled && !props.isRunning) {
              props.runPrompt();
            }
          }
        }}
        autosize
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
