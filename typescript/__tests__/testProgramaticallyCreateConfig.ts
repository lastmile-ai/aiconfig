import { AIConfigRuntime } from "../lib/config";
import { JSONObject } from "../common";
import { extractOverrideSettings } from "../lib/util/configUtils";
import { InferenceSettings, ModelMetadata } from "../types";

describe("test extract_override_settings", () => {
  // shared state
  let aiConfigRuntime: AIConfigRuntime = AIConfigRuntime.create(
    "Untitled AIConfig",
    undefined,
    undefined,
    { models: { testmodel: { topP: 0.9 } } }
  );

  it("Test Case 1: Retrieve global setting from AIConfig with 1 model", () => {
    const modelId: string = "testmodel";

    const globalSettingsForTestModel =
      aiConfigRuntime.getGlobalSettings(modelId);
    expect(globalSettingsForTestModel).toEqual({ topP: 0.9 });
  });
});

describe("test extract_override_settings", () => {
  // shared state
  let aiConfigRuntime: AIConfigRuntime =
    AIConfigRuntime.create("Untitled AIConfig");

  it("Test Case 1: No global setting, Expect an override", () => {
    const initialSettings: InferenceSettings = { topP: 0.9 };
    const modelId: string = "testmodel";

    const override = extractOverrideSettings(
      aiConfigRuntime,
      initialSettings,
      modelId
    );
    expect(override).toEqual(initialSettings);
  });

  it("Test Case 2: Global Settings differ, expect override", () => {
    const initialSettings: InferenceSettings = { topP: 0.9 };
    const modelId: string = "testmodel";

    // Add a global setting that differs
    aiConfigRuntime.addModel({ name: modelId, settings: { topP: 0.8 } });

    const override = extractOverrideSettings(
      aiConfigRuntime,
      initialSettings,
      modelId
    );
    expect(override).toEqual(initialSettings);
  });

  it("Test Case 3: Global Settings match settings, expect no override", () => {
    const initialSettings: InferenceSettings = { topP: 0.9 };
    const modelId: string = "testmodel";

    // Update the global setting to match initialSettings
    aiConfigRuntime.updateModel({
      name: modelId,
      settings: { topP: 0.9 },
    } as ModelMetadata);

    const override = extractOverrideSettings(
      aiConfigRuntime,
      initialSettings,
      modelId
    );
    console.log("overidess: ", override);

    expect(override).toEqual({});
  });

  it("Test Case 4: Global settings defined and empty settings defined, Expect no override", () => {
    const modelId: string = "testmodel";

    const inferenceSettings = {} as JSONObject;

    const override = extractOverrideSettings(
      aiConfigRuntime,
      inferenceSettings,
      modelId
    );
    expect(override).toEqual({});
  });
});
