import { AIConfigRuntime } from "aiconfig";
import { LlamaModelParser } from "aiconfig-extension-llama";
import { CallbackEvent, CallbackManager } from "aiconfig/dist/lib/callback";

async function main() {
  const llamaModelParser = new LlamaModelParser();

  AIConfigRuntime.registerModelParser(llamaModelParser, [
    "llama-2-7b-chat",
    "llama-2-13b-chat",
    "codeup-llama-2-13b-chat-hf",
  ]);

  const config = AIConfigRuntime.load("../llama-aiconfig.json");

  async function aiConfigCallback(event: CallbackEvent) {
    process.stdout.write(`\nEVENT: ${event.name}\n`);
  }

  const callbackManager = new CallbackManager([aiConfigCallback]);
  config.setCallbackManager(callbackManager);

  function writeStreamCallback(data: string) {
    process.stdout.write(data);
  }

  const callbacks = { streamCallback: writeStreamCallback };
  const options = { stream: true, callbacks };

  await config.run("prompt7b", undefined, options);
  await config.run("prompt7b_chat", undefined, options);
  await config.run("prompt13b", undefined, options);
  await config.run("prompt13b_code", undefined, options);
}

main();
