import { JSONObject } from "../common";
import { Output, Prompt } from "../types";
import { AIConfigRuntime } from "./config";

/**
 * This is an abstract class that defines how to deserialize a prompt and run inference for it using a model.
 * This is meant to be highly extensible to allow any kind of model to be used with the AIConfig.
 */
export abstract class ModelParser {
  /**
   * The name of the model. This is used as the key in the model registry for this ModelParser, and specified as the model ID in the AIConfig.
   */
  protected _id!: string;

  public get id() {
    return this._id;
  }

  public set id(id: string) {
    this._id = id;
  }

  /**
   * Serialize a prompt and additional metadata/model settings into a Prompt object that can be saved in the AIConfig.
   * @param promptName The name to save the prompt as.
   * @param data The prompt data to serialize into the Prompt object.
   * @param aiConfig The AIConfig that the prompt belongs to.
   * @see Prompt
   * @example data: {prompt: "Hello {{name}}", parameters: {name: "World"}, inferenceSettings: {temperature: 0.5, systemPrompt:"Be a friendly assistant"}}
   */
  public abstract serialize<T = JSONObject>(
    promptName: string,
    data: T,
    aiConfig: AIConfigRuntime
  ): Prompt;

  /**
   * Deserialize a Prompt object loaded from an AIConfig into a structure that can be used for model inference.
   * @param prompt The Prompt object from an AIConfig to deserialize into a structure that can be used for model inference.
   * @param aiConfig The AIConfig that the prompt belongs to.
   * @returns Completion params that can be used for model inference.
   */
  public abstract deserialize<R = JSONObject>(
    prompt: Prompt,
    aiConfig: AIConfigRuntime
  ): R;

  /**
   * Executes model inference for the given prompt based on the provided completion data.
   * @param prompt The Prompt to run inference for.
   * @param data The completion data to use for inference. This may include parameter overrides, settings, etc.
   * @param aiConfig
   */
  public abstract run<T = JSONObject>(
    prompt: Prompt,
    data: T,
    aiConfig: AIConfigRuntime
  ): Promise<Output>;
}
