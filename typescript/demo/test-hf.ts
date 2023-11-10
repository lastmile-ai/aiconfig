import OpenAI from "openai";
import * as path from "path";
import { AIConfigRuntime } from "../lib/config";
import { HuggingFaceTextGenerationModelParser } from "../../Extensions/mistral/typescript/hf";
import { Prompt } from "../types";

async function run() {
  const config = AIConfigRuntime.load(
    path.join(__dirname, "/mistral-config.json")
  );

  // register HF MP
  const mistralModelParser = new HuggingFaceTextGenerationModelParser(
    "mistralai/Mistral-7B-v0.1",
    true
  );
  AIConfigRuntime.registerModelParser(mistralModelParser, [
    "mistralai/Mistral-7B-v0.1",
  ]);

  console.log("Deserialize Prompt1: ");
  console.log(await config.resolve("prompt1"));
  console.log("\nRun Prompt1: ");
  console.log(await config.run("prompt1"));

  console.log("Latest output: ", config.getOutputText("prompt1"));

  console.log("serialize prompt2: ");
  const prompts = (await config.serialize(
    "mistralai/Mistral-7B-v0.1",
    { inputs: "Hello, world!" },
    "prompt2"
  )) as Prompt[];

  const prompt2 = prompts[0];

  console.log("Prompt2: ", prompt2);
  console.log("adding prompt2, ", config.addPrompt(prompt2, prompt2.name));

  console.log("Deserialize Prompt2: ");
  console.log(await config.resolve("prompt2"));
  console.log("\nRun Prompt2: ");
  console.log(await config.run("prompt2"));

  //stream
  const inferenceOptions = {
    callbacks: {
      streamCallback: (data: any, _accumulatedData: any, _index: any) => {
        process.stdout.write(data);
      },
    },
  };

  console.log("starting to stream: \n");
  await config.run("prompt1", undefined, inferenceOptions);

  config.save("config.json");
}

run();

const hfMP = new HuggingFaceTextGenerationModelParser(
  "mistralai/Mistral-7B-v0.1",
  true
);
AIConfigRuntime.registerModelParser(hfMP, ["mistralai/Mistral-7B-v0.1"]);
