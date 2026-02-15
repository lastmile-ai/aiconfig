import { createStyles, useMantineTheme } from "@mantine/core";
import { Editor, Monaco } from "@monaco-editor/react";
import { JSONObject, JSONValue } from "aiconfig";
import { memo } from "react";

type Props = {
  content: JSONValue;
  onChangeContent: (value: JSONValue) => void;
  schema?: JSONObject;
};

const useStyles = createStyles(() => ({
  monacoEditor: {
    minHeight: "300px",
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function configureEditor(
  _editor: Monaco["editor"]["IStandaloneCodeEditor"],
  monaco: Monaco,
  schema?: JSONObject
) {
  // Validate the text against PromptInput schema
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [
      {
        uri: "https://json.schemastore.org/aiconfig-1.0",
        fileMatch: ["*"],
        // schema: {
        //     $ref: "#/definitions/PromptInput",
        // }
        // TODO: Figure out how to reference PromptInput definition from the uri schema
        // Getting the following error:
        // $ref '/definitions/PromptInput' in 'https://json.schemastore.org/aiconfig-1.0' can not be resolved.(768)

        schema,
      },
    ],
    enableSchemaRequest: true,
  });
}

export default memo(function JSONEditor({
  content,
  onChangeContent,
  schema,
}: Props) {
  const theme = useMantineTheme();
  const { classes } = useStyles();

  return (
    <Editor
      defaultLanguage="json"
      value={JSON.stringify(content, null, 2)}
      onChange={(value) => {
        if (!value) {
          return;
        }
        try {
          const updatedContent = JSON.parse(value);
          onChangeContent(updatedContent);
        } catch (e) {
          return;
        }
      }}
      theme={theme.colorScheme === "dark" ? "vs-dark" : undefined}
      className={classes.monacoEditor}
      options={{
        lineNumbers: false,
        minimap: { enabled: false },
        wordWrap: "on",
      }}
      onMount={(editor, monaco) => {
        if (schema) {
          configureEditor(editor, monaco, schema);
        }
      }}
    />
  );
});
