import { Prompt } from "../types";
import { ModelParser } from "./modelParser";

export class ModelParserRegistry {
  public static parsers: Map<string, ModelParser> = new Map<
    string,
    ModelParser
  >();

  /**
   * Adds a model parser to the registry. This model parser is used to parse Prompts in the AIConfig that use the given model.
   * @param modelParser The model parser to add to the registry.
   * @param ids Optional list of model IDs to register the model parser for. If unspecified, the model parser will be registered for modelParser.id.
   */
  public static registerModelParser(
    modelParser: ModelParser<any, any>,
    ids?: string[]
  ) {
    if (ids) {
      for (const id of ids) {
        this.parsers.set(id, modelParser);
      }
    } else {
      this.parsers.set(modelParser.id, modelParser);
    }
  }

  /**
   * Retrieves a model parser from the registry.
   * @param id The ID of the model parser to get.
   */
  public static getModelParser(id: string) {
    return this.parsers.get(id);
  }

  public static getModelParserForPrompt(prompt: Prompt) {
    const id =
      typeof prompt.metadata.model === "string"
        ? prompt.metadata.model
        : prompt.metadata.model?.name;

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
