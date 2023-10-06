import { JSONObject } from "../common";
import { Prompt, Output } from "../types";
import { AIConfigRuntime } from "./config";
import { ModelParser } from "./modelParser";
import { resolvePrompt } from "./parameterize";

/**
 * An abstract ModelParser that handles parameterized prompts that contain Handlebars templates.
 * For more information on Handlebars, see https://handlebarsjs.com/guide/#basic-usage.
 * This class provides the core functionality for deserializing and parsing prompts, resolving parameters and managing references between prompts.
 * However, it does not implement any model-specific logic.
 */
export abstract class ParameterizedModelParser<
  T = JSONObject,
  R = JSONObject
> extends ModelParser<T, string> {
  public deserialize(prompt: Prompt, aiConfig: AIConfigRuntime) {
    return resolvePrompt(prompt, aiConfig);
  }
}
