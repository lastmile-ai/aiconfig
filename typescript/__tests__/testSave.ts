// FileWriter.test.ts
import * as fs from "fs";
import * as path from "path";
import { tmpdir } from "os";
import { AIConfigRuntime } from "../lib/config";

describe("AIConfigRuntime save()", () => {
  it("saves the config and checks if the config json doesn't have key filePath", () => {
    const tmpDir = tmpdir(); // Get the system's temporary directory
    const newFileName = "modified_config.json";
    const tempFilePath = path.join(tmpDir, newFileName);

    const filePath = path.join(
      __dirname,
      "samples",
      "basic_chatgpt_query_config.json"
    );

    const aiconfig = AIConfigRuntime.load(filePath);
    // Modify and save the configuration
    aiconfig.save(tempFilePath);

    // Open and parse the saved JSON file
    const savedConfig = JSON.parse(fs.readFileSync(tempFilePath, "utf8"));

    // Perform your assertions
    expect(savedConfig.hasOwnProperty("filePath")).toBe(false);
  });
});
