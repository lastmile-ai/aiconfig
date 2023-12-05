// import { expect, test, jest } from "@jest/globals";
import { AIConfigRuntime } from "../../../lib/config";
import path = require("path");

import { getAPIKeyFromEnv } from "../../../lib/utils";
// Import the real OpenAI module

import { ChatCompletion, ChatCompletionCreateParamsNonStreaming, Completions } from "openai/resources/chat/completions";
import OpenAI from "openai";
import { APIPromise } from "openai/core";
import { ExecuteResult } from "../../../types";

// // Mocked OpenAI chat completion method
// export const mockOpenAIChatCompletionImpl = jest.fn((message: string) => {
//   // Provide your desired mocked response here
//   const mockedResponse = "This is a mocked response from OpenAI chat completion.";

//   return new Promise((resolve) => {
//     // Simulate an async delay of 1 second before resolving
//     setTimeout(() => {
//       resolve({ choices: [{ message: { content: mockedResponse } }] });
//     }, 1000);
//   });
// });

// const mockTextGeneration = jest.fn().mockImplementation(mockOpenAIChatCompletionImpl);

// // Mock OpenAI object

// // Mock OpenAI library
// jest.mock("openai", () => {
//   const originalModule = jest.requireActual("openai");

//   return {
//     ...originalModule,
//     default: jest.fn().mockImplementation(() => ({
//       completion: mockTextGeneration,
//     })),
//   };
// });

const mockGetApiKeyFromEnv = getAPIKeyFromEnv as jest.MockedFunction<typeof getAPIKeyFromEnv>;

jest.mock("../../../lib/utils", () => {
  const originalModule = jest.requireActual("../../../lib/utils");
  return {
    ...originalModule,
    getAPIKeyFromEnv: jest.fn(),
  };
});

mockGetApiKeyFromEnv.mockReturnValue("test-api-key");

const response = {
  id: "chatcmpl-8SXHt8Ei7jnzJZM1TS7quXNPU0jvO",
  object: "chat.completion",
  created: 1701811833,
  model: "gpt-3.5-turbo-0613",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content:
          "As an AI, I don't have personal preferences or tastes. However, some common favorite condiments among people are ketchup, mayonnaise, mustard, or hot sauce.",
      },
      finish_reason: "stop",
    },
  ],
  usage: { prompt_tokens: 14, completion_tokens: 36, total_tokens: 50 },
  system_fingerprint: null,
};

describe("OpenAI ModelParser", () => {
  // Without this, the model parser will throw an error when it checks for its api key
  const mockfn = jest.fn((apiKeyName) => {
    return "test api key";
  });

  // Mock GetAPIKeyFromEnv with impl above
  jest.mock("../../../lib/utils", () => {
    const originalModule = jest.requireActual("../../../lib/utils");
    return {
      ...originalModule,
      getAPIKeyFromEnv: mockfn,
    };
  });

  // Mock Openai
  // Completions.create() is the api method that takes in completion params and returns a respone.
  // OpenAI Model Parser uses async create(). To mock it, you have to return a promise. MockResolvedValue() is a jest function that returns a promise.
  jest.spyOn(Completions.prototype, "create").mockResolvedValue(response as any);

  // Setup. Load Config.
  const aiconfigFilePath = path.join(__dirname, "basic_chatgpt_query_config.json");
  const aiconfig = AIConfigRuntime.load(aiconfigFilePath);

  test("deserialize prompt", async () => {
    const result = await aiconfig.resolve("prompt1");
    expect(result).toEqual({
      messages: [{ content: "What is your favorite condiment?", role: "user" }],
      model: "gpt-3.5-turbo",
      temperature: 1,
      top_p: 1,
      stream: false,
      frequency_penalty: undefined,
      function_call: undefined,
      functions: undefined,
      logit_bias: undefined,
      max_tokens: undefined,
      n: undefined,
      presence_penalty: undefined,
      stop: undefined,
      user: undefined,
    });
  });

  test("run prompt", async () => {
    const results = await aiconfig.run("prompt1") as ExecuteResult[];

    expect(results[0]).toEqual({
      data: {
        content:
          "As an AI, I don't have personal preferences or tastes. However, some common favorite condiments among people are ketchup, mayonnaise, mustard, or hot sauce.",
        role: "assistant",
      },
      execution_count: 0,
      metadata: {
        created: 1701811833,
        finish_reason: "stop",
        id: "chatcmpl-8SXHt8Ei7jnzJZM1TS7quXNPU0jvO",
        model: "gpt-3.5-turbo-0613",
        object: "chat.completion",
        system_fingerprint: null,
        usage: { completion_tokens: 36, prompt_tokens: 14, total_tokens: 50 },
      },
      output_type: "execute_result",
    });
  });
});
