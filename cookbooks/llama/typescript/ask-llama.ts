import { AIConfigRuntime } from "aiconfig";
import { LlamaModelParser } from "aiconfig-extension-llama";

async function main() {
  const llamaModelParser = new LlamaModelParser();

  AIConfigRuntime.registerModelParser(llamaModelParser, [
    "llama-2-7b-chat",
    "llama-2-13b-chat",
    "codeup-llama-2-13b-chat-hf",
  ]);

  const config = AIConfigRuntime.load("../llama-aiconfig.json");

  const response7b = await config.run("prompt7b");
  console.log(response7b);

  const response7bChat = await config.run("prompt7b_chat");
  console.log(response7bChat);

  const response13b = await config.run("prompt13b");
  console.log(response13b);

  const response13bCode = await config.run("prompt13b_code");
  console.log(response13bCode);
}

main();
