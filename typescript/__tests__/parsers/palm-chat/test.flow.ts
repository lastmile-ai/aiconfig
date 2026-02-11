import { AIConfigRuntime } from "../../../lib/config";
import path from "path";
import { ExecuteResult, Output, Prompt } from "../../../types";
import { DiscussServiceClient, TextServiceClient, protos } from "@google-ai/generativelanguage";

import { JSONObject } from "../../../common";
import { getAPIKeyFromEnv } from "../../../lib/utils";
import { PaLMChatParser } from "../../../lib/parsers/palmChat";

const PALM_CONFIG_PATH = path.join(__dirname, "palm-chat-aiconfig.json");

const mockGetApiKeyFromEnv = getAPIKeyFromEnv as jest.MockedFunction<typeof getAPIKeyFromEnv>;

// This could probably be abstracted out into a test util
jest.mock("../../../lib/utils", () => {
  const originalModule = jest.requireActual("../../../lib/utils");
  return {
    ...originalModule,
    getAPIKeyFromEnv: jest.fn(),
  };
});

mockGetApiKeyFromEnv.mockReturnValue("test-api-key");

AIConfigRuntime.registerModelParser(new PaLMChatParser());

describe("PaLM Chat ModelParser", () => {
  test("serializing params to config prompt", async () => {
    // no need to instantiate model parser. Load will instantiate it for us since its a default parser
    const aiConfig = AIConfigRuntime.load(PALM_CONFIG_PATH);

    const completionParams: protos.google.ai.generativelanguage.v1beta2.IGenerateMessageRequest = {
      model: "models/chat-bison-001",
      // Note: top_p matches global config settings for the model and temperature is different
      topP: 0.9,
      temperature: 0.8,
      prompt: { messages: [{ content: "What are 5 interesting things to do in Toronto?" }] },
    };

    const prompts = (await aiConfig.serialize("models/chat-bison-001", completionParams as JSONObject, "interestingThingsToronto")) as Prompt[];

    expect(prompts).toHaveLength(1);
    const promptExpected: Prompt = {
      name: "interestingThingsToronto",
      input: "What are 5 interesting things to do in Toronto?",
      metadata: {
        model: {
          name: "models/chat-bison-001",
          settings: {
            temperature: 0.8,
          },
        },
      },
    };

    const prompt = prompts[0];
    expect(prompt).toEqual(promptExpected);
  });

  test("serialize chat history data to config", async () => {
    const aiConfig = AIConfigRuntime.load(PALM_CONFIG_PATH);
    const completionParamsWithChatHistory = {
      model: "models/chat-bison-001",
      temperature: 0.9,
      topP: 0.9,
      prompt: {
        // Context is the System Prompt for PaLM
        context: "be chill",
        messages: [
          { author: "0", content: "Hello" },
          { author: "1", content: "Hi there! How can I help you today?" },
          { author: "0", content: "Just chillin" },
          {
            author: "1",
            content: "That's great! Chilling is a great way to relax and de-stress. I hope you're having a good day.",
          },
        ],
      },
      topK: null,
      candidateCount: null,
    };
    const prompts = (await aiConfig.serialize("models/chat-bison-001", completionParamsWithChatHistory as JSONObject, "prompt")) as Prompt[];
    expect(prompts.length).toEqual(2);
    for (const serializedPrompt of prompts) {
      expect(serializedPrompt.metadata?.model).toEqual("models/chat-bison-001");
      expect(serializedPrompt.metadata?.settings).toEqual({
        temperature: 0.9,
        topP: 0.9,
        context: "be chill",
      });
    }
  });

  test("deserializing prompt with history", async () => {
    const aiconfig = AIConfigRuntime.load(PALM_CONFIG_PATH);

    const deserialized = await aiconfig.resolve("prompt1");
    expect(deserialized).toEqual({
      model: "models/chat-bison-001",
      temperature: 0.9,
      topP: 0.9,
      prompt: {
        messages: [{ author: "0", content: "What is your favorite condiment? Respond with the answer in one word." }],
        context: null,
        examples: null,
      },
      topK: null,
      candidateCount: null,
    });
  });

  test("run prompt, non-streaming", async () => {
    // When Jest Mocking Palm Chat Generation, Typing requires a never type for the return value of generateText. Not sure why this is happening
    // TODO: @ankush-lastmile Figure out why this is happening
    jest.spyOn(DiscussServiceClient.prototype, "generateMessage").mockResolvedValue([
      {
        candidates: [{ author: "1", content: "Ketchup." }],
        messages: [
          {
            author: "0",
            content: "What is your favorite condiment? Respond with the answer in one word.",
          },
        ],
        filters: [],
      },
      null,
      null,
    ] as never);

    const aiconfig = AIConfigRuntime.load(PALM_CONFIG_PATH);

    const [result] = (await aiconfig.run("prompt1")) as Output[];
    expect((result as ExecuteResult).data).toEqual("Ketchup.");
  });
});
