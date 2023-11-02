import { JSONObject } from "../../common";
import { InferenceSettings, ModelMetadata } from "../../types";
import { AIConfigRuntime } from "../config";
import _ from "lodash";

/**
 *  Extract inference settings with overrides based on inference settings.
 *
 *    This function takes the inference settings and a model ID and returns a subset
 *    of inference settings that have been overridden by model-specific settings. It
 *    compares the provided settings with global settings, and returns only those that
 *    differ or have no corresponding global setting.
 * @param configRuntime The AIConfigRuntime that the prompt belongs to.
 * @param inferenceSettings The model settings from the input data.
 * @param modelId The model ID of the prompt.
 * @returns The model settings from the input data.
 */
export function extractOverrideSettings(
  configRuntime: AIConfigRuntime,
  inferenceSettings: InferenceSettings,
  modelId: string
) {
  let modelMetadata: ModelMetadata | string;
  const modelName = modelId;
  const globalModelSettings = configRuntime.getGlobalSettings(modelName) ?? ({} as InferenceSettings);
  inferenceSettings = inferenceSettings ?? ({} as InferenceSettings);

  if (globalModelSettings != null) {
    // Check if the model settings from the input data are the same as the global model settings

    // Compute the difference between the global model settings and the model settings from the input data
    // If there is a difference, then we need to add the different model settings as overrides on the prompt's metadata
    const keys = _.union(
      _.keys(globalModelSettings),
      _.keys(inferenceSettings)
    );
    const overrides = _.reduce(
      keys,
      (result: JSONObject, key) => {
        if (!_.isEqual(globalModelSettings[key], inferenceSettings[key])) {
          result[key] = inferenceSettings[key];
        }
        return result;
      },
      {}
    );

    return overrides;
  }
  return inferenceSettings;
}
