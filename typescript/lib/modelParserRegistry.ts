import { Prompt } from "../types";
import { AIConfigRuntime } from "./config";
import { ModelParser } from "./modelParser";

/**
 * A dictionary to store registered model parsers by their IDs. It stores both:
 *  1) model_name --> model_parser (ex: "mistralai/Mistral-7B-v0.1" -->
 *      HuggingFaceTextGenerationTransformer)
 *  2) moder_parser.id() --> model_parser (ex: HuggingFaceTextGenerationTransformer
 *      works with many different Text Generation models) so is saved as
 *      HuggingFaceTextGenerationTransformer.id() (str) (usually it's classname) -->
 *      HuggingFaceTextGenerationTransformer (obj)
 *
 * The reason we allow 2) above is so that you can define the relationship between a
 * model name and a model parser in the AIConfig instead of the model parser class (ex:
 * https://github.com/lastmile-ai/aiconfig/blob/main/cookbooks/HuggingFace/Mistral-aiconfig.json#L16-L18).
 * This then gets updated into the desired format 1) by calling the
 * `update_model_parser_registry_with_config_runtime()` command
 *
 * Each model_name is only allowed to map to a single model_parser for an
 * AIConfigRuntime.
 */
export class ModelParserRegistry {
  public static parsers: Map<string, ModelParser> = new Map<
    string,
    ModelParser
  >();

  /**
   * Adds a model parser to the registry. This model parser is used to parse Prompts in the AIConfig that use the given model.
   * @param modelParser The model parser to add to the registry.
   * @param ids (list, optional): Optional list of IDs (typically model names) to
   *    register the model parser under. If unspecified, the model parser will
   *    be resgistered under its own ID.
   */
  public static registerModelParser(
    modelParser: ModelParser<any, any>,
    ids?: string[]
  ) {
    if (ids) {
      for (const id of ids) {
        this.parsers.set(id, modelParser);
      }
    }

    this.parsers.set(modelParser.id, modelParser);
  }

  /**
   * Retrieves a model parser from the registry.
   * @param id The ID of the model parser to get.
   */
  public static getModelParser(id: string) {
    return this.parsers.get(id);
  }

  public static getModelParserForPrompt(
    prompt: Prompt,
    aiConfig: AIConfigRuntime
  ) {
    let id: string;

    if (prompt?.metadata?.model != null) {
      id =
        typeof prompt.metadata.model === "string"
          ? prompt.metadata.model
          : prompt.metadata.model?.name;
    } else if (aiConfig.metadata.default_model != null) {
      id = aiConfig.metadata.default_model;
    } else {
      throw new Error(
        `E3041: Cannot find model ID. No default model specified in AIConfig metadata, and prompt ${prompt.name} does not specify a model`
      );
    }

    return this.getModelParser(id);
  }

  /**
   * Removes a model parser from the registry.
   * @param id The ID of the model parser to remove.
   */
  public static removeModelParser(id: string) {
    this.parsers.delete(id);
  }

  /**
   * Removes all model parsers from the registry.
   */
  public static clearRegistry() {
    this.parsers.clear();
  }
}
