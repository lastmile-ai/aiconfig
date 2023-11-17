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

import { HuggingFaceTextGenerationModelParser } from "../../../extensions/HuggingFace/typescript/lib/hf";

async function main() {
  const textGenerationModelParser = new HuggingFaceTextGenerationModelParser();

  const config = AIConfigRuntime.load("../Mistral-aiconfig.json");

  ModelParserRegistry.registerModelParser(
    new HuggingFaceTextGenerationModelParser()
  );

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

  const inferenceOptions: InferenceOptions = { callbacks };
  await config.run("prompt1", inferenceOptions);
}

main();
