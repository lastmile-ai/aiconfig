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
  // Step 1. Initialize The model parser
  const textGenerationModelParser = new HuggingFaceTextGenerationModelParser();

  // Step 2. Register the model parser
  AIConfigRuntime.registerModelParser(
    new HuggingFaceTextGenerationModelParser()
  );

  // Step 3. Load the AIConfig
  const config = AIConfigRuntime.load("../Mistral-aiconfig.json");

  // Step 4. Define the Callback to be used when streaming
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

}

main();
