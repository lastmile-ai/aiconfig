import { JSONObject, JSONValue } from "./common";

/**
 * AIConfig schema, latest version. For older versions, see AIConfigV*.
 */
export type AIConfig = {
  /**
   * Friendly name descriptor for the AIConfig. Could default to the filename if not specified.
   */
  name: string;

  /**
   * Description of the AIConfig.
   * If you have a collection of different AIConfigs, this may be used for dynamic prompt routing.
   */
  description?: string;

  /**
   * The version of the AIConfig schema.
   */
  schema_version: SchemaVersion;

  /**
   * Root-level metadata that applies to the entire AIConfig.
   */
  metadata: {
    /**
     * Parameter definitions that are accessible to all prompts in this AIConfig.
     * These parameters can be referenced in the prompts using {{param_name}} handlebars syntax.
     * For more information, see https://handlebarsjs.com/guide/#basic-usage.
     */
    parameters?: JSONObject;

    /**
     * Globally defined model settings. Any prompts that use these models will have these settings applied by default,
     * unless they override them with their own model settings.
     */
    models?: GlobalModelMetadata;

    /**
     * Default model to use for prompts that do not specify a model.
     */
    default_model?: string;

    /**
     * Model ID to ModelParser ID mapping.
     * This is useful if you want to use a custom ModelParser for a model, or if a single ModelParser can handle multiple models.
     */
    model_parsers?: {
      /**
       * Key is Model ID, Value is ModelParser ID.
       */
      [model_name: string]: string;
    };

    [k: string]: any;
  };

  /**
   * Array of prompts that make up the AIConfig.
   */
  prompts: Prompt[];

  [k: string]: any;
};

export type SchemaVersion =
  | {
      major: number;
      minor: number;
    }
  | "v1"
  | "latest";

export type Attachment = {
  /**
   * The data representing the attachment
   */
  data: JSONValue;

  /**
   * The MIME type of the result. If not specified, the MIME type will be
   * assumed to be text/plain
   */
  mime_type?: string;

  /**
   * Attachment metadata
   */
  metadata?: {
    [k: string]: any;
  };
};

export type PromptInput =
  | {
      /**
       * Attachments can be used to pass in multiple inputs of varying MIME types (ex: image, audio)
       */
      attachments?: Attachment[];

      /**
       * Input to the model. This can represent a single input, or multiple inputs.
       * The structure of the data object is up to the ModelParser.
       */
      data?: JSONValue;

      [k: string]: any;
    }
  | string;

export type InferenceSettings = JSONObject;
export type GlobalModelMetadata = {
  [model_name: string]: InferenceSettings;
};

export type ModelMetadata = {
  /**
   * The ID of the model to use.
   */
  name: string;

  /**
   * Model inference settings that apply to this prompt.
   */
  settings?: InferenceSettings;
};

export type Prompt = {
  /**
   * A unique identifier for the prompt. This is used to reference the prompt in other parts of the AIConfig (such as other prompts)
   */
  name: string;

  /**
   * The prompt string, or a more complex prompt object.
   */
  input: PromptInput;

  metadata?: {
    /**
     * Parameter definitions that are accessible to this prompt.
     * These parameters can be referenced in the prompt using {{param_name}} handlebars syntax.
     * For more information, see https://handlebarsjs.com/guide/#basic-usage.
     */
    parameters?: JSONObject;

    /**
     * Model name/settings that apply to this prompt.
     * These settings override any global model settings that may have been defined in the AIConfig metadata.
     * If this is a string, it is assumed to be the model name.
     * If this is undefined, the default model specified in the default_model property will be used for this Prompt.
     */
    model?: ModelMetadata | string;

    /**
     * Tags for this prompt. Tags must be unique, and must not contain commas.
     */
    tags?: string[];

    [k: string]: any;
  };

  /**
   * Execution, display, or stream outputs.
   */
  outputs?: Output[];
};

//#region Prompt Outputs

/**
 * Model inference result.
 */
export type Output = ExecuteResult | Error;

/**
 * The output type of the result from executing a prompt.
 * We use this the kind field to determine how to parse it.
 */
export type OutputData =
  | {
      kind: "string" | "file_uri" | "base64";
      value: string;
    }
  | {
      kind: "function";
      value: {
        name: string;
        arguments: string;
        [k: string]: any;
      };
    };

/**
 * Result of executing a prompt.
 */
export type ExecuteResult = {
  /**
   * Type of output.
   */
  output_type: "execute_result";

  /**
   * A result's prompt number.
   */
  execution_count?: number;

  /**
   * The result of executing the prompt.
   */
  data: OutputData | JSONValue;
  /**
   * The MIME type of the result. If not specified, the MIME type will be assumed to be plain text.
   */
  mime_type?: string;

  /**
   * Output metadata.
   */
  metadata?: {
    [k: string]: any;
  };
};

/**
 * Output of an error that occurred during inference.
 */
export type Error = {
  /**
   * Type of output.
   */
  output_type: "error";

  /**
   * The name of the error.
   */
  ename: string;

  /**
   * The value, or message, of the error.
   */
  evalue: string;

  /**
   * The error's traceback, represented as an array of strings.
   */
  traceback: string[];
};

//#endregion

//#region AIConfig Versions

/**
 * AIConfig v1 schema.
 */
export type AIConfigV1 = AIConfig;

//#endregion
