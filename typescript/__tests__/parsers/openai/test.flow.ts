import { AIConfigRuntime } from "../../../lib/config";
import path = require("path");
import { OpenAI } from "openai";
import { getAPIKeyFromEnv } from "../../../lib/utils";

// Mocked OpenAI chat completion method
export const mockOpenAIChatCompletion = jest.fn((message: string) => {
  // Provide your desired mocked response here
  const mockedResponse = "This is a mocked response from OpenAI chat completion.";

  return new Promise((resolve) => {
    // Simulate an async delay of 1 second before resolving
    setTimeout(() => {
      resolve({ choices: [{ message: { content: mockedResponse } }] });
    }, 1000);
  });
});

// Mock OpenAI object
jest.mock("openai", () => {
  return {
    OpenAI: jest.fn(() => ({
      complete: mockOpenAIChatCompletion,
    })),
  };
});

const mockGetApiKeyFromEnv = getAPIKeyFromEnv as jest.MockedFunction<
  typeof getAPIKeyFromEnv
>;

jest.mock("../../../lib/utils", () => {
  const originalModule = jest.requireActual("../../../lib/utils");
  return {
    ...originalModule,
    getAPIKeyFromEnv: jest.fn(),
  };
});

mockGetApiKeyFromEnv.mockReturnValue("test-api-key");

describe("OpenAI ModelParser", () => {
  const aiconfigFilePath = path.join(__dirname, "../../samples", "basic_chatgpt_query_config.json");

  const aiconfig = AIConfigRuntime.load(aiconfigFilePath);

  test("deserialize prompt", async () => {
    const result = await aiconfig.resolve("prompt1");
    expect(result).toEqual({
      messages: [{ content: "Hi! Tell me 10 cool things to do in NYC.", role: "user" }],
      model: "gpt-3.5-turbo",
      temperature: 1,
      top_p: 1,
    });
  });

  test("run prompt", async () => {
    const result = await aiconfig.run("prompt1");
    expect(result).toEqual({
      messages: [{ content: "Hi! Tell me 10 cool things to do in NYC.", role: "user" }],
      model: "gpt-3.5-turbo",
      temperature: 1,
      top_p: 1,
    });
  });

});
