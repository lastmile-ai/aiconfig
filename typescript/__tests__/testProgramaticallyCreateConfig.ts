import { AIConfigRuntime } from "../lib/config";
import { JSONObject } from "../common";

import { InferenceSettings, ModelMetadata } from "../types";
import { extractOverrideSettings } from "../lib/utils";

describe("test Get Global Settings", () => {
  // shared state
  let aiConfigRuntime: AIConfigRuntime = AIConfigRuntime.create(
    "Untitled AIConfig",
    /*param description*/ undefined,
    "latest",
    { models: { testmodel: { topP: 0.9 } } }
  );

  test("Retrieving global setting from AIConfig with 1 model", () => {
    const modelId: string = "testmodel";

    const globalSettingsForTestModel =
      aiConfigRuntime.getGlobalSettings(modelId);
    expect(globalSettingsForTestModel).toEqual({ topP: 0.9 });
  });
});

describe("ExtractOverrideSettings function", () => {
  // shared state
  let aiConfigRuntime: AIConfigRuntime =
    AIConfigRuntime.create("Untitled AIConfig");

  test("Should return initial settings when no global settings are defined", () => {
    const initialSettings: InferenceSettings = { topP: 0.9 };
    const modelId: string = "testmodel";

    const override = extractOverrideSettings(
      aiConfigRuntime,
      initialSettings,
      modelId
    );
    expect(override).toEqual(initialSettings);
  });

  test("Should return an override when initial settings differ from global settings", () => {
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

  test("Should return empty override when global settings match initial settings", () => {
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

    expect(override).toEqual({});
  });

  it("Should return empty override when Global settings defined and initial settings are empty", () => {
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
