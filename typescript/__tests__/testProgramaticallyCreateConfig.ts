import { AIConfigRuntime } from "../lib/config";
import { InferenceSettings } from "../types";

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
