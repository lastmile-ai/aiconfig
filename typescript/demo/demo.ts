#!/usr/bin/env -S npm run tsn -T

import OpenAI from "openai";
import * as path from "path";
import { AIConfigRuntime } from "../lib/config";
import { InferenceOptions } from "../lib/modelParser";

// This example is taken from https://github.com/openai/openai-node/blob/v4/examples/demo.ts
// and modified to show the same functionality using AIConfig.

// gets API Key from environment variable OPENAI_API_KEY
// process.env.OPENAI_API_KEY =

async function openAIWithoutAIConfig() {
  // gets API Key from environment variable OPENAI_API_KEY
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Non-streaming:
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: "Say this is a test" }],
  });

  console.log(JSON.stringify(completion));
  console.log(completion.choices[0]?.message?.content);

  // Streaming:
  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: "Say this is a test" }],
    stream: true,
  });
  for await (const part of stream) {
    process.stdout.write(part.choices[0]?.delta?.content || "");
  }
  process.stdout.write("\n");
}

async function openAIWithAIConfig() {
  const aiConfig = AIConfigRuntime.load(
    path.join(__dirname, "demo.aiconfig.json")
  );

  const params = {
    name: "Demo",
  };

  const completionParams = await aiConfig.resolve("demoPrompt", params);
  // {"model":"gpt-4-0613","messages":[{"content":"Say this is a Demo test","role":"user"},{"role":"assistant","content":"This is a test."}]}
  console.log("demoPrompt=", JSON.stringify(completionParams));

  // Non-streaming:
  let result = await aiConfig.run(
    "demoPrompt",
    params,
    /*options*/ {
      stream: false,
    }
  );
  if (!Array.isArray(result)) {
    result = [result];
  }

  // This is a Demo test.
  console.log(aiConfig.getOutputText("demoPrompt"));
  // Alternatively:
  //   for (const output of result) {
  //     console.log(aiConfig.getOutputText("demoPrompt", output));
  //   }

  const inferenceOptions: InferenceOptions = {
    callbacks: {
      streamCallback: (data: any, _accumulatedData: any, _index: any) => {
        process.stdout.write(data?.content || "\n");
      },
    },
  };

  const streamCallback = (data: any, _accumulatedData: any, _index: any) => {
    process.stdout.write(data?.content || "\n");
  };

  // Streaming:
  let result2 = await aiConfig.run(
    "demoPrompt",
    /*params*/ {
      name: "Streaming Demo",
    },
    inferenceOptions
  );

  // This is a Streaming Demo test.
  console.log(aiConfig.getOutputText("demoPrompt"));
}

async function createAIConfig() {
  const model = "gpt-4-0613";
  const data = {
    model,
    messages: [
      { role: "user", content: "Say this is a test" },
      { role: "assistant", content: "This is a test." },
    ],
  };

  const aiConfig = AIConfigRuntime.create("demo", "this is a demo AIConfig");
  const result = await aiConfig.serialize(model, data, "demoPrompt");

  if (Array.isArray(result)) {
    for (const prompt of result) {
      aiConfig.addPrompt(prompt);
    }
  } else {
    aiConfig.addPrompt(result);
  }

  aiConfig.save("demo/demo.aiconfig.json", { serializeOutputs: true });
}

// Uncomment this to use OpenAI directly (without AIConfig)
// openAIWithoutAIConfig();

// Uncomment this to use OpenAI with AIConfig -- observe the difference in usage (it should be simpler)
openAIWithAIConfig();

// Uncomment this to create an AIConfig programmatically
// createAIConfig();
await createAIConfig();
