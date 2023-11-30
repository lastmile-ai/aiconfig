import { AIConfigRuntime } from "../../../lib/config";
import path = require("path");

import { getAPIKeyFromEnv } from "../../../lib/utils";
// Import the real OpenAI module
import OpenAI from "openai";

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
  id: "chatcmpl-8QMLFmCSRwKeXcYLLtgVStTtzz0jv",
  object: "chat.completion",
  created: 1701293101,
  model: "gpt-3.5-turbo-0613",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content:
          "Certainly! Here are 10 cool things to do in New York City:\n" +
          "\n" +
          "1. Visit the High Line: This elevated park built on a historic freight rail line offers stunning views of the city, unique art installations, and beautiful gardens.\n" +
          "\n" +
          "2. Explore Central Park: Rent a bike, have a picnic, or take a leisurely stroll in this iconic green oasis in the heart of Manhattan.\n" +
          "\n" +
          "3. Wander through the Brooklyn Botanic Garden: Located in the borough of Brooklyn, this garden features various themed sections, including a Japanese garden, cherry blossom grove, and a beautiful rose garden.\n" +
          "\n" +
          "4. Experience the vibrant nightlife in Times Square: Witness the bustling atmosphere, bright lights, Broadway shows, and countless restaurants and entertainment options in this famous intersection.\n" +
          "\n" +
          "5. Take a boat ride to Staten Island: Hop on the Staten Island Ferry for free and enjoy breathtaking views of the Statue of Liberty, Ellis Island, and the Manhattan skyline.\n" +
          "\n" +
          "6. Visit the Metropolitan Museum of Art: Explore this world-renowned museum with its vast collection of art from different eras and various civilizations.\n" +
          "\n" +
          "7. Stroll along the Brooklyn Bridge: Take a walk across this iconic suspension bridge, offering stunning views of the Manhattan skyline and the East River.\n" +
          "\n" +
          "8. Discover the Museum of Natural History: Get enthralled by the exhibits showcasing dinosaurs, ancient civilizations, and the wonders of the natural world.\n" +
          "\n" +
          "9. Explore the diverse neighborhoods: From Chinatown to Little Italy, SoHo to Williamsburg, exploring the cultural and culinary offerings of different NYC neighborhoods is a must-do.\n" +
          "\n" +
          "10. Indulge in delicious food: NYC is a culinary melting pot, so be sure to try diverse cuisines, famous street food like hot dogs and pretzels, and visit traditional delis and trendy eateries.\n" +
          "\n" +
          "Note: It's always a good idea to check for any travel restrictions, updated operating hours, or reservation requirements for these attractions before visiting.",
      },
      finish_reason: "stop",
    },
  ],
  usage: { prompt_tokens: 20, completion_tokens: 384, total_tokens: 404 },
};

// Mock the OpenAI module
jest.mock("openai", () => {
  return {
    __esModule: true, // this property makes it work like a normal ES6 default import module

    default: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockReturnValue(response),
          },
        },
      };
    }),
    // Do same for ClientOptions if required.
  };
});

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
