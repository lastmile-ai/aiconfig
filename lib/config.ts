import { JSONObject, JSONValue } from "../common";
import {
  AIConfig,
  GlobalModelMetadata,
  ModelMetadata,
  Output,
  Prompt,
  SchemaVersion,
} from "../types";
import { ModelParser } from "./modelParser";
import { ModelParserRegistry } from "./modelParserRegistry";

export type PromptWithOutputs = Prompt & { outputs?: Output[] };

/**
 * Represents an AIConfig. This is the main class for interacting with AIConfig files.
 * Note: the "Runtime" suffix implies that this class stores the outputs of the prompt executions
 * in-memory, which can be serialized optionally to a file @see AIConfigRuntime.save.
 */
export class AIConfigRuntime implements AIConfig {
  [k: string]: any;
  name: string;
  description?: string | undefined;
  schema_version: SchemaVersion;
  metadata: {
    [k: string]: any;
    parameters?: JSONObject | undefined;
    models?: GlobalModelMetadata | undefined;
  };
  prompts: PromptWithOutputs[];

  public constructor(
    name: string,
    description?: string,
    schemaVersion: SchemaVersion = "latest"
  ) {
    this.name = name;
    this.description = description;
    this.schema_version = schemaVersion;
    this.metadata = {};
    this.prompts = [];
  }

  //#region Create/Load/Save

  /**
   * Loads an AIConfig from a file.
   * @param aiconfigFilePath File path to the AIConfig to load.
   */
  public static load(aiconfigFilePath: string) {}

  /**
   * Loads an AIConfig from an AI Workbook.
   * For more information on AI Workbooks, see https://docs.lastmileai.dev/workbooks/intro-to-workbooks.
   *
   * NOTE: `LASTMILE_API_TOKEN` must be set in the environment.
   *
   * @param workbookId The ID of the workbook to load.
   * @todo Add documentation link on how to get API token.
   */
  public static loadFromWorkbook(workbookId: string) {}

  /**
   * Create an empty AIConfig.
   * @param name The name of the AIConfig.
   * @param description Optional description of the AIConfig.
   * @param schemaVersion Schema version for the AIConfig. Defaults to "latest".
   */
  public static create(
    name: string,
    description?: string,
    schemaVersion: SchemaVersion = "latest"
  ) {
    return new AIConfigRuntime(name, description, schemaVersion);
  }

  /**
   * Saves this AIConfig to a file.
   * @param filePath The path to the file to save to.
   * @param serializeOutputs Whether to serialize the outputs of the prompts to the file (defaults to false).
   */
  public save(filePath: string, serializeOutputs: boolean = false) {}

  /**
   * Saves this AIConfig to an AI Workbook.
   * For more information on AI Workbooks, see https://docs.lastmileai.dev/workbooks/intro-to-workbooks.
   *
   * NOTE: `LASTMILE_API_TOKEN` must be set in the environment.
   *
   * @param workbookId The ID of the workbook to save to. If unspecified, a new workbook is created and the URL is returned.
   * @todo Add documentation link on how to get API token.
   */
  public saveToWorkbook(workbookId?: string) {}

  //#endregion

  //#region Model Parser Registry

  /**
   * Adds a model parser to the registry. This model parser is used to parse Prompts in the AIConfig that use the given model.
   * @param modelParser The model parser to add to the registry.
   * @param ids Optional list of model IDs to register the model parser for. If unspecified, the model parser will be registered for modelParser.id.
   */
  public static registerModelParser(modelParser: ModelParser, ids?: string[]) {
    ModelParserRegistry.registerModelParser(modelParser, ids);
  }

  /**
   * Retrieves a model parser from the registry.
   * @param id The ID of the model parser to get.
   */
  public static getModelParser(id: string) {
    ModelParserRegistry.getModelParser(id);
  }

  //#endregion

  //#region Prompt resolution and inference

  /**
   * Resolves a given prompt/prompt chain in the AIConfig with the given parameters.
   * Note: If the prompt references other prompts in the AIConfig, their outputs will be used as inputs.
   * @param promptName The name of the prompt to resolve.
   * @param params The parameters to use when resolving the prompt.
   * @example "If you have a prompt for GPT-4, the result of this function will return the fully constructed completion params \
   * that can be used to call the GPT-4 API. It will combine all the parameters, references and metadata specified in the AIConfig."
   */
  public async resolve(promptName: string, params: JSONObject = {}) {}

  /**
   * Runs inference for a given prompt in the AIConfig with the given parameters.
   * Note: If the prompt references other prompts in the AIConfig, their existing outputs will be used as inputs.
   * To re-run all prompt dependencies, use `AIConfigRuntime.runWithDependencies` instead.
   * @param promptName The name of the the prompt to run inference for.
   * @param params The parameters to use when resolving the prompt.
   */
  public async run(promptName: string, params: JSONObject = {}) {}

  /**
   * Same as `AIConfigRuntime.run`, but re-runs all prompt dependencies.
   * @see AIConfigRuntime.run
   * @example "If you have a prompt P2 that depends on another prompt P1's output, this function will run P1 first,\
   * then use the output of P1 to resolve P2 and run it. Concretely, it executes inference on the DAG of prompt dependencies."
   */
  public async runWithDependencies(
    promptName: string,
    params: JSONObject = {}
  ) {}

  //#endregion

  //#region CRUD operations for AIConfig properties

  public setName(name: string) {}
  public setDescription(description: string) {}

  /**
   * Add a prompt to the AIConfig.
   * @param prompt The prompt to add.
   * @param promptName Optional name of the prompt. If unspecified, the prompt's name will be used or a randomly generated name will be used.
   */
  public addPrompt(prompt: Prompt, promptName?: string) {}

  /**
   * Update the prompt with the given name in the AIConfig.
   * @param promptName The name of the prompt to update.
   * @param prompt The prompt object containing the updated prompt data.
   */
  public updatePrompt(promptName: string, prompt: Prompt) {}

  /**
   * Delete the prompt with the given name from the AIConfig.
   * @param promptName The name of the prompt to delete.
   */
  public deletePrompt(promptName: string) {}

  /**
   * Adds model settings to AIConfig-level metadata.
   * @param modelMetadata The model metadata to add.
   * @param promptName If specified, the model settings will only be applied to the prompt with the given name.
   */
  public addModel(modelMetadata: ModelMetadata, promptName?: string) {}

  /**
   * Updates model settings in AIConfig-level metadata.
   * @param modelMetadata The model metadata to update.
   * @param promptName If specified, the model settings will only be applied to the prompt with the given name.
   */
  public updateModel(modelMetadata: ModelMetadata, promptName?: string) {}

  /**
   * Removes model settings from AIConfig-level metadata.
   * NOTE: This does not update any of the prompts in the AIConfig, just the global metadata.
   * @param modelName The name of the model to remove.
   */
  public deleteModel(modelName: string) {}

  /**
   * Sets a parameter in the AIConfig to the specified JSON-serializable value.
   * @param name Parameter name.
   * @param value Parameter value (can be a JSON-serializable object with sub-properties).
   * @param promptName If specified, the parameter will only be applied to the prompt with the given name.
   */
  public setParameter(name: string, value: JSONValue, promptName?: string) {}
  // TODO: saqadri - we probably don't need update here, just set and delete
  public updateParameter(name: string, value: JSONValue, promptName?: string) {}

  /**
   * Removes a parameter from the AIConfig.
   * @param name Name of parameter to delete.
   * @param promptName If specified, the parameter will only be deleted from the prompt with the given name.
   */
  public deleteParameter(name: string, promptName?: string) {}

  /**
   * Sets a metadata property in the AIConfig to the JSON-serializable value.
   * @param key Metadata key.
   * @param value Metadata value (can be a JSON-serializable object with sub-properties).
   * @param promptName If specified, the metadata will only be updated for the prompt with the given name.
   */
  public setMetadata(key: string, value: JSONValue, promptName?: string) {}

  /**
   * Removes a metadata property in the AIConfig.
   * @param key Metadata key to remove.
   * @param promptName If specified, the metadata will only be updated for the prompt with the given name.
   */
  public deleteMetadata(key: string, promptName?: string) {}

  /**
   * Gets the metadata for the AIConfig.
   * @param promptName If specified, the metadata will only be retrieved for the prompt with the given name. Note that
   * this will merge the AIConfig-level metadata with the prompt-level metadata.
   */
  public getMetadata(promptName?: string) {}

  //#endregion
}
