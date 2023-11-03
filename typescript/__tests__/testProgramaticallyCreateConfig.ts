import { AIConfigRuntime } from "../lib/config";
import { InferenceSettings } from "../types";

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
