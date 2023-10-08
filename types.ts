import { JSONObject, JSONValue } from "./common";

/**
 * AIConfig schema, latest version. For older versions, see AIConfigV*.
 */
export type AIConfig = {
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

    [k: string]: any;
  };

  /**
   * Array of prompts that make up the AIConfig.
   */
  prompts: Prompt[];

  [k: string]: any;
};

/**
 * AIConfig v1 schema.
 */
export type AIConfigV1 = AIConfig;

export type SchemaVersion =
  | {
      major: number;
      minor: number;
    }
  | "v1"
  | "latest";

export type PromptInput =
  | {
      /**
       * Any additional inputs to the model.
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
  name: string;
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

  metadata: {
    /**
     * Parameter definitions that are accessible to this prompt.
     * These parameters can be referenced in the prompt using {{param_name}} handlebars syntax.
     * For more information, see https://handlebarsjs.com/guide/#basic-usage.
     */
    parameters?: JSONObject;

    /**
     * Model name/settings that apply to this prompt.
     * These settings override any global model settings that may have been defined in the AIConfig metadata.
     *
     */
    model: ModelMetadata | string;

    /**
     * Tags for this prompt. Tags must be unique, and must not contain commas.
     */
    tags?: string[];

    [k: string]: any;
  };

  /**
   * Execution, display, or stream outputs.
   * Ignore: this is a work-in-progress
   */
  outputs?: Output[];
};

//#region Prompt Outputs (Work-in-progress)

/**
 * Model inference result.
 * Ignore: this is a work-in-progress
 */
export type Output = JSONObject | ExecuteResult | DisplayData | Stream | Error;

/**
 * Result of executing a prompt.
 */
export interface ExecuteResult {
  /**
   * Type of output.
   */
  output_type: "execute_result";

  /**
   * A result's prompt number.
   */
  execution_count: number | null;

  /**
   * A mime-type keyed dictionary of data
   */
  data: {
    /**
     * mimetype output (e.g. text/plain), represented as either an array of strings or a string.
     */
    [k: string]: string | string[];
  };

  /**
   * Output metadata.
   */
  metadata: {
    [k: string]: any;
  };
}

/**
 * Data displayed as a result of inference.
 */
export interface DisplayData {
  /**
   * Type of output.
   */
  output_type: "display_data";

  /**
   * A mime-type keyed dictionary of data
   */
  data: {
    /**
     * mimetype output (e.g. text/plain), represented as either an array of strings or a string.
     */
    [k: string]: string | string[];
  };

  /**
   * Output metadata.
   */
  metadata: {
    [k: string]: any;
  };
}

/**
 * Stream output from inference.
 */
export interface Stream {
  /**
   * Type of output.
   */
  output_type: "stream";

  /**
   * The name of the stream (stdout, stderr).
   */
  name: string;

  /**
   * The stream's text output, represented as an array of strings.
   */
  text: string | string[];
}

/**
 * Output of an error that occurred during inference.
 */
export interface Error {
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
}

//#endregion
