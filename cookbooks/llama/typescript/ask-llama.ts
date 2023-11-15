import { AIConfigRuntime } from "aiconfig";
import {
  LlamaModelParser,
  SUPPORTED_MODELS as llamaModels,
} from "aiconfig-extension-llama";

async function main() {
  const llamaModelParser = new LlamaModelParser();

  AIConfigRuntime.registerModelParser(llamaModelParser, llamaModels);

  const config = AIConfigRuntime.load("../llama-aiconfig.json");

  const response7b = await config.run("prompt7b");
  console.log(response7b);
}

main();
