import { AIConfigRuntime } from "../../../lib/config";
import path from "path";
import { ExecuteResult, Output, Prompt } from "../../../types";
import { TextServiceClient, protos } from "@google-ai/generativelanguage";
import { PaLMTextParser } from "../../../lib/parsers/palm";
import { JSONObject } from "../../../common";
import { getAPIKeyFromEnv } from "../../../lib/utils";

const PALM_CONFIG_PATH = path.join(__dirname, "palm-text.aiconfig.json");

const mockGetApiKeyFromEnv = getAPIKeyFromEnv as jest.MockedFunction<
  typeof getAPIKeyFromEnv
>;

// This could probably be abstracted out into a test util
jest.mock("../../../lib/utils", () => {
  const originalModule = jest.requireActual("../../../lib/utils");
  return {
    ...originalModule,
    getAPIKeyFromEnv: jest.fn(),
  };
});

mockGetApiKeyFromEnv.mockReturnValue("test-api-key");

describe("PaLM Text ModelParser", () => {
  test("serializing params to config prompt", async () => {
    // no need to instantiate model parser. Load will instantiate it for us since its a default parser
    const aiConfig = AIConfigRuntime.load(PALM_CONFIG_PATH);

    const completionParams: protos.google.ai.generativelanguage.v1beta2.IGenerateTextRequest =
      {
        model: "models/text-bison-001",
        // Note: top_p matches global config settings for the model and temperature is different
        topP: 0.9,
        temperature: 0.8,
        prompt: { text: "What are 5 interesting things to do in Toronto?" },
      };

    // Casting as JSONObject since the type of completionParams is protos.google.ai.generativelanguage.v1beta2.IGenerateTextRequest doesn't confrom to shape even though it looks like it does
    const prompts = (await aiConfig.serialize(
      "models/text-bison-001",
      completionParams as JSONObject,
      "interestingThingsToronto"
    )) as Prompt[];

    expect(prompts).toHaveLength(1);
    const prompt = prompts[0];

    expect(prompt.name).toEqual("interestingThingsToronto");
    expect(prompt.input).toEqual(
      "What are 5 interesting things to do in Toronto?"
    );
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

  test("run prompt, non-streaming", async () => {
    // When Jest Mocking Palm Text Generation, Typing requires a never type for the return value of generateText. Not sure why this is happening
    // TODO: @ankush-lastmile Figure out why this is happening
    jest.spyOn(TextServiceClient.prototype, "generateText").mockResolvedValue([
      {
        candidates: [
          {
            safetyRatings: [
              {
                category: "HARM_CATEGORY_DEROGATORY",
                probability: "NEGLIGIBLE",
              },
              {
                category: "HARM_CATEGORY_TOXICITY",
                probability: "NEGLIGIBLE",
              },
              {
                category: "HARM_CATEGORY_VIOLENCE",
                probability: "NEGLIGIBLE",
              },
              {
                category: "HARM_CATEGORY_SEXUAL",
                probability: "NEGLIGIBLE",
              },
              {
                category: "HARM_CATEGORY_MEDICAL",
                probability: "NEGLIGIBLE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS",
                probability: "NEGLIGIBLE",
              },
            ],
            output: "Ranch",
          },
        ],
        filters: [],
        safetyFeedback: [],
      },
      null,
      null,
    ] as never);

    const aiconfig = AIConfigRuntime.load(PALM_CONFIG_PATH);

    const [result] = (await aiconfig.run("prompt1")) as Output[];
    expect((result as ExecuteResult).data).toEqual({
      kind: "string",
      value: "Ranch",
    });
  });
});
