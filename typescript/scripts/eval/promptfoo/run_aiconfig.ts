import { AIConfigRuntime } from "../../../lib/config";
import fs from "fs";
import path from "path";

async function main() {
  let settings_path = process.argv[2];
  let question = process.argv[3];
  let settings = _load_settings(settings_path);
  let prompt_name = settings["prompt_name"];
  let aiconfig_path = settings["aiconfig_path"];

  let fullAIConfigPath = path.join(__dirname, aiconfig_path);
  let runtime = AIConfigRuntime.load(fullAIConfigPath);
  let params = {
    the_query: question,
  };
  let result = await runtime.run(prompt_name, params);
  let final_output: string;

  let r0 = Array.isArray(result) ? result[0] : result;
  final_output = runtime.getOutputText(prompt_name, r0);
  console.log(final_output);
}

function _load_settings(settings_path: string) {
  let rawdata = fs.readFileSync(settings_path, "utf-8");
  let settings = JSON.parse(rawdata);
  return settings;
}

main();
