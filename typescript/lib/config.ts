import { JSONObject, JSONValue } from "../common";
import {
  AIConfig,
  InferenceSettings,
  ModelMetadata,
  Output,
  Prompt,
  SchemaVersion,
} from "../types";
import { InferenceOptions, ModelParser } from "./modelParser";
import { ModelParserRegistry } from "./modelParserRegistry";
import axios from "axios";
import * as fs from "fs";
import _ from "lodash";
import { getAPIKeyFromEnv } from "./utils";
import { ParameterizedModelParser } from "./parameterizedModelParser";
import { OpenAIChatModelParser, OpenAIModelParser } from "./parsers/openai";
import { PaLMTextParser } from "./parsers/palm";
import { extractOverrideSettings } from "./utils";
import { HuggingFaceTextGenerationParser } from "./parsers/hf";
import { CallbackEvent, CallbackManager } from "./callback";

/**
 * Options for saving an AIConfig to a file.
 */
export type SaveOptions = {
  /**
   * Whether to serialize the outputs of the prompts to the file (defaults to false).
   */
  serializeOutputs?: boolean;
};

ModelParserRegistry.registerModelParser(new OpenAIModelParser(), [
  "babbage-002",
  "davinci-002",
  "gpt-3.5-turbo-instruct",
  "text-davinci-003",
  "text-davinci-002",
  "text-davinci-001",
  "code-davinci-002",
  "text-curie-001",
  "text-babbage-001",
  "text-ada-001",
]);

ModelParserRegistry.registerModelParser(new OpenAIChatModelParser(), [
  "gpt-4",
  "gpt-4-0314",
  "gpt-4-0613",
  "gpt-4-32k",
  "gpt-4-32k-0314",
  "gpt-4-32k-0613",
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-16k",
  "gpt-3.5-turbo-0301",
  "gpt-3.5-turbo-0613",
  "gpt-3.5-turbo-16k-0613",
]);
ModelParserRegistry.registerModelParser(new HuggingFaceTextGenerationParser());
ModelParserRegistry.registerModelParser(new PaLMTextParser());

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
  metadata: AIConfig["metadata"];
  prompts: Prompt[];

  filePath?: string;
  callbackManager: CallbackManager = CallbackManager.createManagerWithLogging();

  public constructor(
    name: string,
    description?: string,
    schemaVersion: SchemaVersion = "latest",
    metadata?: AIConfig["metadata"],
    prompts?: Prompt[]
  ) {
    this.name = name;
    this.description = description;
    this.schema_version = schemaVersion;
    this.metadata = metadata || {};
    this.prompts = prompts || [];
  }

  //#region Create/Load/Save

  /**
   * Loads an AIConfig from a file.
   * @param aiConfigFilePath File path to the AIConfig to load.
   */
  public static load(aiConfigFilePath: string) {
    const aiConfigString = fs.readFileSync(aiConfigFilePath, "utf8");
    const aiConfigObj = JSON.parse(aiConfigString);

    const config = this.loadJSON(aiConfigObj);
    config.filePath = aiConfigFilePath;

    return config;
  }

  /**
   * Loads an AIConfig from a JSON object.
   * @param aiConfigObj JSON object to load the AIConfig from.
   */
  public static loadJSON(aiConfigObj: any) {
    // TODO: saqadri - validate that the type satisfies AIConfig interface
    const aiConfig = new AIConfigRuntime(
      aiConfigObj.name,
      aiConfigObj.description,
      aiConfigObj.schema_version,
      aiConfigObj.metadata,
      aiConfigObj.prompts
    );

    const remainingProps = _.omit(
      aiConfigObj,
      "name",
      "description",
      "schema_version",
      "metadata",
      "prompts"
    );

    Object.assign(aiConfig, remainingProps);

    // Update the ModelParserRegistry with any model parsers specified in the AIConfig
    if (aiConfig.metadata.model_parsers) {
      for (const [modelName, modelParserId] of Object.entries(
        aiConfig.metadata.model_parsers
      )) {
        const modelParser = ModelParserRegistry.getModelParser(modelParserId);
        if (!modelParser) {
          throw new Error(
            `E1001: Unable to load AIConfig: It specifies ${JSON.stringify(
              aiConfig.metadata.model_parsers
            )}, but ModelParser ${modelParserId} for model ${modelName} does not exist. Make sure you have registered the ModelParser using AIConfigRuntime.registerModelParser before loading the AIConfig.`
          );
        }

        ModelParserRegistry.registerModelParser(modelParser, [modelName]);
      }
    }

    return aiConfig;
  }

  /**
   * Loads an AIConfig from an AI Workbook.
   * For more information on AI Workbooks, see https://docs.lastmileai.dev/workbooks/intro-to-workbooks.
   *
   * NOTE: `LASTMILE_API_TOKEN` must be set in the environment.
   *
   * @param workbookId The ID of the workbook to load.
   * @todo Add documentation link on how to get API token.
   */
  public static async loadFromWorkbook(workbookId: string) {
    const lastMileAPIEndpoint = "http://lastmileai.dev/api";
    const apiKey = getAPIKeyFromEnv("LASTMILE_API_TOKEN");
    const headers = { Authorization: `Bearer ${apiKey}` };
    const url = `${lastMileAPIEndpoint}/workbooks/aiConfig?id=${workbookId}`;
    return axios
      .get(url, { headers })
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(
            `E1005: Failed to load workbook. Status code: ${response.status}`
          );
        }

        const data = response.data;
        // Process the data retrieved from the API
        return this.loadJSON(data);
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });
  }

  /**
   * Create an empty AIConfig.
   * @param name The name of the AIConfig.
   * @param description Optional description of the AIConfig.
   * @param schemaVersion Schema version for the AIConfig. Defaults to "latest".
   */
  public static create(
    name: string,
    description?: string,
    schemaVersion: SchemaVersion = "latest",
    metadata?: AIConfig["metadata"],
    prompts?: Prompt[]
  ) {
    return new AIConfigRuntime(
      name,
      description,
      schemaVersion,
      metadata,
      prompts
    );
  }

  /**
   * Saves this AIConfig to a file.
   * @param filePath The path to the file to save to.
   * @param saveOptions Options that determine how to save the AIConfig to the file.
   */
  public save(filePath?: string, saveOptions?: SaveOptions) {
    const keysToOmit = ["filePath", "callbackManager"] as const;

    try {
      // Create a Deep Copy and omit fields that should not be saved
      const aiConfigObj: Omit<AIConfigRuntime, (typeof keysToOmit)[number]> =
        _.omit(_.cloneDeep(this), keysToOmit);

      if (!saveOptions?.serializeOutputs) {
        const prompts = [];
        for (const prompt of aiConfigObj.prompts) {
          prompts.push(_.omit(prompt, "outputs"));
        }
        aiConfigObj.prompts = prompts;
      }

      // TODO: saqadri - make sure that the object satisfies the AIConfig schema
      const aiConfigString = JSON.stringify(aiConfigObj, null, 2);

      if (!filePath) {
        filePath = this.filePath ?? "aiconfig.json";
      }

      fs.writeFileSync(filePath, aiConfigString);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Saves this AIConfig to an AI Workbook.
   * For more information on AI Workbooks, see https://docs.lastmileai.dev/workbooks/intro-to-workbooks.
   *
   * NOTE: `LASTMILE_API_TOKEN` must be set in the environment.
   *
   * @param workbookId The ID of the workbook to save to. If unspecified, a new workbook is created and the URL is returned.
   * @todo Add documentation link on how to get API token.
   */
  public saveToWorkbook(workbookId?: string) {
    throw new Error("Not yet implemented");
  }

  //#endregion

  //#region Model Parser Registry

  /**
   * Adds a model parser to the registry. This model parser is used to parse Prompts in the AIConfig that use the given model.
   * @param modelParser The model parser to add to the registry.
   * @param ids Optional list of model IDs to register the model parser for. If unspecified, the model parser will be registered for modelParser.id.
   */
  public static registerModelParser(
    modelParser: ModelParser<any, any>,
    ids?: string[]
  ) {
    ModelParserRegistry.registerModelParser(modelParser, ids);
  }

  /**
   * Retrieves a model parser from the registry.
   * @param id The ID of the model parser to get.
   */
  public static getModelParser(id: string) {
    return ModelParserRegistry.getModelParser(id);
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
  public async resolve(promptName: string, params: JSONObject = {}) {
    const startEvent = {
      name: "on_resolve_start",
      file: __filename,
      data: { promptName, params },
    } as CallbackEvent;
    await this.callbackManager.runCallbacks(startEvent);
    const prompt = this.getPrompt(promptName);
    if (!prompt) {
      throw new Error(
        // TODO (rossdanlm): Centralize all the error messages so don't have to edit each one manually
        `E1011: Prompt '${promptName}' does not exist. Available prompts are: ${this.prompts}.`
      );
    }

    const modelName = this.getModelName(prompt);
    const modelParser = ModelParserRegistry.getModelParser(modelName);
    if (!modelParser) {
      throw new Error(
        `E1012: Unable to resolve prompt '${promptName}': ModelParser for model '${modelName}' does not exist`
      );
    }

    const resolvedPrompt = modelParser.deserialize(prompt, this, params);
    const endEvent = {
      name: "on_resolve_end",
      file: __filename,
      data: { result: resolvedPrompt },
    };
    await this.callbackManager.runCallbacks(endEvent);
    return resolvedPrompt;
  }

  /**
   * Serializes the completion params into a Prompt object. Inverse of the `resolve` function.
   * @param modelName The model name to create a Prompt object for.
   * @param data The data to save as a Prompt object.
   * @param params Optional parameters to save alongside the Prompt.
   * @returns A Prompt or list of Prompts representing the input data.
   */
  public async serialize(
    modelName: string,
    data: JSONObject,
    promptName: string,
    params?: JSONObject
  ): Promise<Prompt | Prompt[]> {
    const startEvent = {
      name: "on_serialize_start",
      file: __filename,
      data: { modelName, data, promptName, params },
    };
    await this.callbackManager.runCallbacks(startEvent);
    const modelParser = ModelParserRegistry.getModelParser(modelName);
    if (!modelParser) {
      throw new Error(
        `E1012: Unable to serialize data ${JSON.stringify(
          data
        )}: ModelParser for model ${modelName} does not exist`
      );
    }

    const prompts = modelParser.serialize(promptName, data, this, params);
    const endEvent = {
      name: "on_serialize_end",
      file: __filename,
      data: { result: prompts },
    };
    await this.callbackManager.runCallbacks(endEvent);
    return prompts;
  }

  /**
   * Runs inference for a given prompt in the AIConfig with the given parameters.
   * Note: If the prompt references other prompts in the AIConfig, their existing outputs will be used as inputs.
   * To re-run all prompt dependencies, use `AIConfigRuntime.runWithDependencies` instead.
   * @param promptName The name of the the prompt to run inference for.
   * @param params The parameters to use when resolving the prompt.
   * @param options Options that determine how to run inference for the prompt (e.g. whether to stream the output or not)
   */
  public async run(
    promptName: string,
    params: JSONObject = {},
    options?: InferenceOptions
  ) {
    const startEvent = {
      name: "on_run_start",
      file: __filename,
      data: { promptName, params, options },
    };
    await this.callbackManager.runCallbacks(startEvent);
    const prompt = this.getPrompt(promptName);
    if (!prompt) {
      throw new Error(
        `E1013: Prompt '${promptName}' does not exist. Available prompts are: ${this.prompts}.`
      );
    }

    const modelName = this.getModelName(prompt);
    const modelParser = ModelParserRegistry.getModelParser(modelName);
    if (!modelParser) {
      throw new Error(
        `E1014: Unable to run prompt '${promptName}': ModelParser for model ${modelName} does not exist`
      );
    }

    // Clear previous run outputs if they exist
    this.deleteOutput(promptName);
    const result = await modelParser.run(prompt, this, options, params);

    // Update the prompt's outputs
    // TODO: saqadri - make sure this actually updates the object and not just the local copy
    // TODO: saqadri - decide if this is needed here at all or if responsibility for saving outputs should be on the ModelParser
    if (Array.isArray(result)) {
      prompt.outputs = result;
    } else {
      prompt.outputs = [result];
    }

    const endEvent = {
      name: "on_run_end",
      file: __filename,
      data: { result: prompt.outputs },
    };
    await this.callbackManager.runCallbacks(endEvent);
    return result;
  }

  /**
   * Same as `AIConfigRuntime.run`, but re-runs all prompt dependencies.
   * @see AIConfigRuntime.run
   * @example "If you have a prompt P2 that depends on another prompt P1's output, this function will run P1 first,\
   * then use the output of P1 to resolve P2 and run it. Concretely, it executes inference on the DAG of prompt dependencies."
   */
  public async runWithDependencies(
    promptName: string,
    params: JSONObject = {},
    options?: InferenceOptions
  ) {
    const prompt = this.getPrompt(promptName);
    if (!prompt) {
      throw new Error(
        `E1015: Prompt '${promptName}' does not exist. Available prompts are: ${this.prompts}.`
      );
    }

    const modelName = this.getModelName(prompt);
    const modelParser = ModelParserRegistry.getModelParser(modelName);
    if (!modelParser) {
      throw new Error(
        `E1016: Unable to run prompt '${promptName}': ModelParser for model '${modelName}' does not exist`
      );
    }

    if (!(modelParser instanceof ParameterizedModelParser)) {
      // TODO: saqadri - determine if we want to just run the prompt without dependencies if it's not a ParameterizedModelParser
      throw new Error(
        `E1017: Unable to identify dependency graph for prompt '${promptName}': ModelParser for model '${modelName}' is not a ParameterizedModelParser`
      );
    }

    const result = await modelParser.runWithDependencies(
      promptName,
      this,
      options,
      params
    );
    return result;
  }

  public setCallbackManager(callbackManager: CallbackManager) {
    this.callbackManager = callbackManager;
  }

  //#endregion

  //#region CRUD operations for AIConfig properties

  public setName(name: string) {
    this.name = name;
  }
  public setDescription(description: string) {
    this.description = description;
  }

  /**
   * Gets a prompt by name from the AIConfig.
   * @param promptName The name of the prompt to get.
   */
  public getPrompt(promptName: string) {
    return this.prompts.find((p) => p.name === promptName);
  }

  /**
   * Add a prompt to the AIConfig.
   * @param prompt The prompt to add.
   * @param promptName Optional name of the prompt. If unspecified, the prompt's name will be used or a randomly generated name will be used.
   */
  public addPrompt(prompt: Prompt, promptName?: string) {
    const name = promptName || prompt.name || _.uniqueId("prompt_");
    const existingPrompt = this.getPrompt(name);
    if (existingPrompt) {
      throw new Error(
        `E1018: Cannot add new prompt with ${name}. Prompt ${name} already exists in AIConfig. Please provide a unique name.`
      );
    }

    prompt.name = name;

    this.prompts.push(prompt);
  }

  /**
   * Update the prompt with the given name in the AIConfig.
   * @param promptName The name of the prompt to update.
   * @param prompt The prompt object containing the updated prompt data.
   */
  public updatePrompt(promptName: string, prompt: Prompt) {
    let found = false;
    for (let i = 0; i < this.prompts.length; i++) {
      if (this.prompts[i].name === promptName) {
        // TODO: decide if we do a merge-update or an overwrite-update (currently doing overwrite)
        this.prompts[i] = { ...prompt };
        // this.prompts[i] = { ...(this.prompts[i]), ...prompt };
        found = true;
        return this.prompts[i];
      }
    }

    if (!found) {
      throw new Error(
        `E1019: Cannot update prompt '${promptName}' because prompt name does not exist. Available prompts are: ${this.prompts}.`
      );
    }
  }

  /**
   * Delete the prompt with the given name from the AIConfig.
   * @param promptName The name of the prompt to delete.
   */
  public deletePrompt(promptName: string) {
    const existingPrompt = this.getPrompt(promptName);
    if (!existingPrompt) {
      throw new Error(
        `E1020: Cannot delete prompt '${promptName}' because prompt name does not exist. Available prompts are: ${this.prompts}.`
      );
    }

    this.prompts = this.prompts.filter((p) => p.name !== promptName);
  }

  /**
   * Adds model settings to AIConfig-level metadata.
   * @param modelMetadata The model metadata to add.
   * @param promptName If specified, the model settings will only be applied to the prompt with the given name.
   */
  public addModel(modelMetadata: ModelMetadata, promptName?: string) {
    if (promptName) {
      const prompt = this.getPrompt(promptName);
      if (!prompt) {
        throw new Error(
          `E1021: Cannot add model ${modelMetadata.name} for prompt '${promptName}' because prompt name does not exist. Available prompts are ${this.prompts}.`
        );
      }

      prompt.metadata = {
        ...prompt.metadata,
        model: modelMetadata,
      };
    } else {
      if (!this.metadata.models) {
        this.metadata.models = {};
      }

      this.metadata.models[modelMetadata.name] = modelMetadata;
    }
  }

  /**
   * Updates model settings in AIConfig-level metadata.
   * @param modelMetadata The model metadata to update.
   * @param promptName If specified, the model settings will only be applied to the prompt with the given name.
   */
  public updateModel(modelMetadata: ModelMetadata, promptName?: string) {
    if (promptName) {
      const prompt = this.getPrompt(promptName);
      if (!prompt) {
        throw new Error(
          `E1022: Cannot update model ${modelMetadata.name} for prompt '${promptName}' because prompt name does not exist. Available prompts are ${this.prompts}.`
        );
      }

      prompt.metadata = {
        ...prompt.metadata,
        model: modelMetadata,
      };
    } else {
      if (!this.metadata.models) {
        this.metadata.models = {};
      }
      if (!modelMetadata.settings) {
        modelMetadata.settings = {};
      }
      this.metadata.models[modelMetadata.name] = modelMetadata.settings;
    }
  }

  /**
   * Removes model settings from AIConfig-level metadata.
   * NOTE: This does not update any of the prompts in the AIConfig, just the global metadata.
   * @param modelName The name of the model to remove.
   */
  public deleteModel(modelName: string) {
    if (!this.metadata.models) {
      return;
    }

    delete this.metadata.models[modelName];
  }

  /**
   * Sets the model to use for all prompts by default in the AIConfig.
   * @param modelName The name of the model to default to.
   */
  public setDefaultModel(modelName: string | undefined) {
    if (modelName == null) {
      delete this.metadata.default_model;
      return;
    }

    this.metadata.default_model = modelName;
  }

  /**
   * Adds a model name : model parser ID mapping to the AIConfig metadata. This model parser will be used to parse Prompts in the AIConfig that use the given model.
   * @param modelName The name of the model to set the parser for.
   * @param modelParserId The ID of the model parser to use for the model. If undefined, the model parser for the model will be removed.
   */
  public setModelParser(modelName: string, modelParserId: string | undefined) {
    if (!this.metadata.model_parsers) {
      this.metadata.model_parsers = {};
    }

    if (modelParserId == null) {
      delete this.metadata.model_parsers[modelName];
      return;
    }

    this.metadata.model_parsers[modelName] = modelParserId;
  }

  /**
   * Sets a parameter in the AIConfig to the specified JSON-serializable value.
   * @param name Parameter name.
   * @param value Parameter value (can be a JSON-serializable object with sub-properties).
   * @param promptName If specified, the parameter will only be applied to the prompt with the given name.
   */
  public setParameter(name: string, value: JSONValue, promptName?: string) {
    if (promptName) {
      const prompt = this.getPrompt(promptName);
      if (!prompt) {
        throw new Error(
          `E1023: Cannot set parameter ${name} for prompt '${promptName}' because prompt name does not exist. Available prompts are ${this.prompts}.`
        );
      }

      prompt.metadata = {
        ...prompt.metadata,
        parameters: {
          ...prompt.metadata?.parameters,
          [name]: value,
        },
      };
    } else {
      if (this.metadata.parameters == null) {
        this.metadata.parameters = {};
      }
      this.metadata.parameters[name] = value;
    }
  }
  // TODO: saqadri - we probably don't need update here, just set and delete
  public updateParameter(name: string, value: JSONValue, promptName?: string) {
    return this.setParameter(name, value, promptName);
  }

  /**
   * Removes a parameter from the AIConfig.
   * @param name Name of parameter to delete.
   * @param promptName If specified, the parameter will only be deleted from the prompt with the given name.
   */
  public deleteParameter(name: string, promptName?: string) {
    if (promptName) {
      const prompt = this.getPrompt(promptName);
      if (!prompt) {
        throw new Error(
          `E1024: Cannot delete parameter ${name} for prompt '${promptName}' because prompt name does not exist. Available prompts are ${this.prompts}.`
        );
      }

      if (prompt.metadata?.parameters == null) {
        return;
      }

      delete prompt.metadata.parameters[name];
    } else {
      if (this.metadata.parameters == null) {
        return;
      }

      delete this.metadata.parameters[name];
    }
  }

  /**
   * Sets a metadata property in the AIConfig to the JSON-serializable value.
   * @param key Metadata key.
   * @param value Metadata value (can be a JSON-serializable object with sub-properties).
   * @param promptName If specified, the metadata will only be updated for the prompt with the given name.
   */
  public setMetadata(key: string, value: JSONValue, promptName?: string) {
    if (promptName) {
      const prompt = this.getPrompt(promptName);
      if (!prompt) {
        throw new Error(
          `E1025: Cannot set metadata ${key} for prompt '${promptName}' because prompt name does not exist. Available prompts are: ${this.prompts}.`
        );
      }

      prompt.metadata = {
        ...prompt.metadata,
        [key]: value,
      };
    } else {
      this.metadata[key] = value;
    }
  }

  /**
   * Removes a metadata property in the AIConfig.
   * @param key Metadata key to remove.
   * @param promptName If specified, the metadata will only be updated for the prompt with the given name.
   */
  public deleteMetadata(key: string, promptName?: string) {
    if (promptName) {
      const prompt = this.getPrompt(promptName);
      if (!prompt) {
        throw new Error(
          `E1026: Cannot delete metadata property '${key}' for prompt '${promptName}' because prompt name does not exist. Available prompts are: ${this.prompts}.`
        );
      }

      delete prompt.metadata?.[key];
    } else {
      delete this.metadata[key];
    }
  }

  /**
   * Gets the metadata for the AIConfig.
   * @param promptName If specified, the metadata will only be retrieved for the prompt with the given name. Note that
   * this will merge the AIConfig-level metadata with the prompt-level metadata.
   */
  public getMetadata(promptName?: string) {
    if (promptName) {
      const prompt = this.getPrompt(promptName);
      if (!prompt) {
        throw new Error(
          `E1027: Cannot get metadata for prompt '${promptName}' because prompt name does not exist. Available prompts are: ${this.prompts}.`
        );
      }

      const globalMetadata = this.metadata;
      const modelName = this.getModelName(prompt);
      const globalModelMetadata: { model: ModelMetadata } = {
        model: {
          name: modelName,
          settings: globalMetadata.models?.[modelName],
        },
      };
      const globalMetadataWithoutModels = _.omit(globalMetadata, "models");

      return {
        ...(globalMetadataWithoutModels || {}),
        ...(globalModelMetadata || {}),
        ...prompt.metadata,
      };
    } else {
      return this.metadata;
    }
  }

  /**
   * Add an output to the prompt with the given name in the AIConfig.
   * @param promptName The name of the prompt to add the output to.
   * @param output The output to add.
   * @param overwrite Whether to overwrite the existing outputs for the prompt, or append to the end (defaults to false).
   */
  public addOutput(
    promptName: string,
    output: Output,
    overwrite: boolean = false
  ) {
    const prompt = this.getPrompt(promptName);
    if (!prompt) {
      throw new Error(
        `E1028: Cannot add output for prompt '${promptName}' because prompt name does not exist. Available prompts are: ${this.prompts}.`
      );
    }

    if (overwrite || prompt.outputs == null) {
      prompt.outputs = [output];
    } else {
      prompt.outputs.push(output);
    }

    return prompt.outputs;
  }

  /**
   * Delete the outputs for the prompt with the given name.
   * @param promptName The name of the prompt whose outputs to delete.
   * @returns The outputs that were deleted from the prompt.
   */
  public deleteOutput(promptName: string) {
    const prompt = this.getPrompt(promptName);
    if (!prompt) {
      throw new Error(
        `E1029: Cannot delete outputs for prompt '${promptName}' because prompt name does not exist. Available prompts are: ${this.prompts}.`
      );
    }

    const existingOutputs = [...(prompt.outputs || [])];
    prompt.outputs = [];

    return existingOutputs;
  }

  /**
   * Gets the latest output associated with a Prompt (if any)
   */
  public getLatestOutput(prompt: string | Prompt): Output | undefined {
    if (typeof prompt === "string") {
      prompt = this.getPrompt(prompt)!;
      if (!prompt) {
        throw new Error(
          `E1029: Cannot delete outputs. Prompt ${prompt} not found in AIConfig.`
        );
      }
    }

    if (prompt.outputs == null || prompt.outputs.length === 0) {
      return undefined;
    }

    return prompt.outputs[prompt.outputs.length - 1];
  }

  /**
   * Extracts the model ID from the Prompt object.
   */
  public getModelName(prompt: string | Prompt) {
    if (typeof prompt === "string") {
      prompt = this.getPrompt(prompt)!;
      if (!prompt) {
        throw new Error(
          `E1030: Cannot delete outputs. Prompt ${prompt} not found in AIConfig.`
        );
      }
    }

    if (typeof prompt?.metadata?.model === "string") {
      return prompt.metadata.model;
    } else if (prompt?.metadata?.model == null) {
      const defaultModel = this.metadata.default_model;
      if (defaultModel == null) {
        throw new Error(
          `E2041: No default model specified in AIConfig metadata, and prompt ${prompt.name} does not specify a model`
        );
      }

      return defaultModel;
    }

    return prompt.metadata.model?.name;
  }

  /**
   * Get the string representing the output from a prompt (if any).
   */
  public getOutputText(prompt: string | Prompt, output?: Output): string {
    if (typeof prompt === "string") {
      prompt = this.getPrompt(prompt)!;
      if (!prompt) {
        throw new Error(
          `E1031: Cannot delete outputs. Prompt ${prompt} not found in AIConfig.`
        );
      }
    }

    const modelParser = ModelParserRegistry.getModelParserForPrompt(
      prompt,
      this
    );
    if (modelParser != null) {
      return modelParser.getOutputText(this, output, prompt);
    }

    // TODO: saqadri - log a warning if the model parser isn't parameterized
    return "";
  }

  /**
   *  Returns the global settings for a given model.
   */
  public getGlobalSettings(modelName: string): InferenceSettings | undefined {
    return this.metadata.models?.[modelName];
  }

  /**
   * Generates a ModelMetadata object from the inference settings by extracting the settings that override the global settings.
   *
   * @param inferenceSettings - The inference settings to be used for the model.
   * @param modelName - The unique identifier for the model.
   * @returns A ModelMetadata object that includes the model's name and optional settings.
   */
  public getModelMetadata(
    inferenceSettings: InferenceSettings,
    modelName: string
  ) {
    const overrideSettings = extractOverrideSettings(
      this,
      inferenceSettings,
      modelName
    );

    if (!overrideSettings || Object.keys(overrideSettings).length === 0) {
      return { name: modelName } as ModelMetadata;
    } else {
      return { name: modelName, settings: overrideSettings } as ModelMetadata;
    }
  }

  //#endregion
}
