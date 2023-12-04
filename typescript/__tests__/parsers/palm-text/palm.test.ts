import { AIConfigRuntime } from "../../../lib/config";
import path from "path";
import { Prompt } from "../../../types";
import { protos } from "@google-ai/generativelanguage";
import { PaLMTextParser } from "../../../lib/parsers/palm";
import { JSONObject } from "../../../common";

const PALM_CONFIG_PATH = path.join(__dirname, "palm-config.json");

describe("PaLM Text ModelParser", () => {
  test("serializing params to config prompt", () => {
    // no need to instantiate model parser. Load will instantiate it for us since its a default parser
    const aiConfig = AIConfigRuntime.load(PALM_CONFIG_PATH);
    const parser = new PaLMTextParser();

    const completionParams: protos.google.ai.generativelanguage.v1beta2.IGenerateTextRequest = {
      model: "models/text-bison-001",
      // Note: top_p matches global config settings for the model and temperature is different
      topP: 0.9,
      temperature: 0.8,
      prompt: { text: "What are 5 interesting things to do in Toronto?" },
    };

    const prompts = parser.serialize("interestingThingsToronto", completionParams as JSONObject, aiConfig) as Prompt[];

    expect(prompts).toHaveLength(1);
    const prompt = prompts[0];

    expect(prompt.name).toEqual("interestingThingsToronto");
    expect(prompt.input).toEqual("What are 5 interesting things to do in Toronto?");
    expect(prompt.metadata?.model).toEqual({
      name: "models/text-bison-001",
      settings: {
        temperature: 0.8,
      },
    });
  });

  test("deserializing params to config", async () => {
    const aiconfig = AIConfigRuntime.load(PALM_CONFIG_PATH);

    const deserialized = await aiconfig.resolve("prompt1");
    expect(deserialized).toEqual({
      model: "models/text-bison-001",
      temperature: 0.9,
      topP: 0.9,
      prompt: { text: "What is your favorite condiment?" },
      topK: null,
      candidateCount: null,
      maxOutputTokens: null,
      safetySettings: null,
      stopSequences: null,
    });
  });

  // test("run prompt, non-streaming", async () => {
  //   jest.mock("@google-ai/generativelanguage", () => {
  //     const originalModule = jest.requireActual("@google-ai/generativelanguage");

  //     return {
  //       ...originalModule,
  //       TextServiceClient: jest.fn().mockImplementation(() => ({
  //         generateText: jest.fn().mockImplementation(() => {
  //           "hi";
  //         }),
  //       })),
  //     };
  //   });

  //   const aiconfig = AIConfigRuntime.load(PALM_CONFIG_PATH);

  //   const result = await aiconfig.run("prompt1");
  //   expect(1).toBe(2);
  // });
});
