import {
  Prompt,
  Output,
  PromptInput,
  ModelMetadata,
  ExecuteResult,
  AIConfigRuntime,
  InferenceOptions,
  InferenceCallbackHandlers,
  ModelParserRegistry,
} from "aiconfig";

import { HuggingFaceTextGenerationModelParser } from "aiconfig-extension-huggingface-textgeneration";

async function main() {
  const textGenerationModelParser = new HuggingFaceTextGenerationModelParser();

  AIConfigRuntime.registerModelParser(
    new HuggingFaceTextGenerationModelParser()
  );

  const config = AIConfigRuntime.load("../Mistral-aiconfig.json");

  function consoleLogCallback(
    data: string,
    accumulatedMessage: string,
    index: number
  ) {
    process.stdout.write(data);
  }

  const callbacks: InferenceCallbackHandlers = {
    streamCallback: consoleLogCallback,
  };

  const inferenceOptions: InferenceOptions = { callbacks, stream: true };

  await config.run("prompt1", undefined, inferenceOptions);

  config.save(undefined, {serializeOutputs: true});
}

main();
