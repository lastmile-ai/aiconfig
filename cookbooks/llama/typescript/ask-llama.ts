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

  function writeStreamCallback(data: string) {
    process.stdout.write(data);
  }

  const callbacks = { streamCallback: writeStreamCallback };
  const options = { stream: true, callbacks };

  await config.run("prompt7b", undefined, options);
  await config.run("prompt7b_chat", options);
  await config.run("prompt13b", options);

  const codeResponse = await config.run("prompt13b_code");
  console.log(codeResponse);
}

main();
