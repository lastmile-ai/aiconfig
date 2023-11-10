import { JSONObject } from "../common";
import { Output, Prompt } from "../types";
import { AIConfigRuntime } from "./config";

/**
 * Options that determine how to run inference for the prompt (e.g. whether to stream the output or not, callbacks, etc.)
 */
export type InferenceOptions = JSONObject & {
  /**
   * Whether to stream the output of the model or not. Defaults to true when possible
   */
  stream?: boolean;

  callbacks?: InferenceCallbackHandlers;
};

export type InferenceCallbackHandlers = {
  /**
   * Called when a model is in streaming mode and an update is available
   * @param data The new data chunk from the stream.
   * @param accumulatedData The running sum of all data chunks received so far.
   * @param index The index of the choice that the data chunk belongs to (by default this will be 0, but if the model generates multiple choices, this will be the index of the choice that the data chunk belongs to)
   */
  streamCallback(
    data: any,
    accumulatedData: any,
    index: number
  ): Promise<any> | any;

  [k: string]: any;
};

/**
 * This is an abstract class that defines how to deserialize a prompt and run inference for it using a model.
 * This is meant to be highly extensible to allow any kind of model to be used with the AIConfig.
 */
export abstract class ModelParser<T = JSONObject, R = T> {
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
   * @param params Optional parameters to save alongside the prompt.
   * @see Prompt
   * @example data: {prompt: "Hello {{name}}", parameters: {name: "World"}, inferenceSettings: {temperature: 0.5, systemPrompt:"Be a friendly assistant"}}
   */
  public abstract serialize(
    promptName: string,
    data: T,
    aiConfig: AIConfigRuntime,
    params?: JSONObject
  ): Prompt | Prompt[];

  /**
   * Deserialize a Prompt object loaded from an AIConfig into a structure that can be used for model inference.
   * @param prompt The Prompt object from an AIConfig to deserialize into a structure that can be used for model inference.
   * @param aiConfig The AIConfig that the prompt belongs to.
   * @param params Optional parameters to override the prompt's parameters with.
   * @returns Completion params that can be used for model inference.
   */
  public abstract deserialize(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    params?: JSONObject
  ): R;

  /**
   * Executes model inference for the given prompt based on the provided completion data.
   * @param prompt The Prompt to run inference for.
   * @param aiConfig The AIConfig that the prompt belongs to.
   * @param options Options that determine how to run inference for the prompt (e.g. whether to stream the output or not)
   * @param params Optional parameters to override the prompt's parameters with.
   */
  public abstract run(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    options?: InferenceOptions,
    params?: JSONObject
  ): Promise<Output | Output[]>;

  /**
   * Get the string representing the output from a prompt.
   */
  public abstract getOutputText(
    aiConfig: AIConfigRuntime,
    output?: Output,
    prompt?: Prompt
  ): string;

  /**
   * Get the model settings for a given prompt, merging any global model settings with the prompt's model settings.
   * @param prompt The prompt to get the model settings for.
   * @param aiConfig The AIConfig that the prompt belongs to.
   * @returns The merged model settings for the prompt.
   */
  public getModelSettings(
    prompt: Prompt,
    aiConfig: AIConfigRuntime
  ): JSONObject | undefined {
    if (prompt == null) {
      return aiConfig.metadata.models?.[this.id];
    }

    const modelMetadata = prompt.metadata?.model;
    if (typeof modelMetadata === "string") {
      return aiConfig.metadata.models?.[modelMetadata];
    } else if (modelMetadata == null) {
      const defaultModel = aiConfig.metadata.default_model;
      if (defaultModel == null) {
        throw new Error(
          `E2040: No default model specified in AIConfig metadata, and prompt ${prompt.name} does not specify a model`
        );
      }

      return aiConfig.metadata.models?.[defaultModel];
    } else {
      const globalModelMetadata =
        aiConfig.metadata.models?.[modelMetadata.name];

      return {
        ...(globalModelMetadata || {}),
        ...(modelMetadata.settings || {}),
      };
    }
  }
}
