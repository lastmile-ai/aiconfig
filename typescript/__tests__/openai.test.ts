import * as openai from "openai";
import { mocked } from "jest-mock";

jest.mock("openai", () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        completions: {
          create: jest.fn().mockImplementation(async (param) => {
            if (param.scenario === "scenario1") {
              return { response: "response_scenario1" };
            } else if (param.scenario === "scenario2") {
              return { response: "response_scenario2" };
            }
          }),
        },
        chat: {
          completions: {
            create: jest.fn(),
          },
        },
      };
    }),
  };
});

const originalProcessEnv = { ...process.env };

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  process.env = originalProcessEnv;
});

describe("Your Test", () => {
  let openaiMock: openai.OpenAI;

  beforeEach(() => {
    openaiMock = new openai.OpenAI(); //mocked(OpenAI, true);
  });

  //   it("should mock openai.chat.completions.create", () => {
  //     // Set up your mock behavior
  //     openaiMock.chat.completions.create.mockResolvedValue({
  //       response: "fake_response",
  //     });

  //     // Your test goes here. It should just call the function without any knowledge that it's been mocked.
  //     // i.e., openai.chat.completions.create(yourArgsHere);
  //   });

  //   it("should mock openai.chat.completions.create2", async () => {
  //     // Your test goes here. It should just call the function without any knowledge that it's been mocked.
  //     const res1 = await openaiMock.chat.completions.create({
  //       scenario: "scenario1",
  //     });
  //     expect(res1).toEqual({ response: "response_scenario1" });

  //     const res2 = await openaiMock.chat.completions.create({
  //       scenario: "scenario2",
  //     });
  //     expect(res2).toEqual({ response: "response_scenario2" });
  //   });
});

// import * as os from "os";

// jest.mock("OpenAI", () => ({
//   completions: {
//     create: jest.fn(),
//   },
// }));

// describe("mock_chat_completion", () => {
//   const scenarios = [
//     { scenario: "scenario1", response: { response: "response_scenario1" } },
//     { scenario: "scenario2", response: { response: "response_scenario2" } },
//   ];
//   beforeAll(() => {
//     scenarios.forEach((scenario) => {
//       (OpenAI.completions.create as jest.Mock).mockReturnValue(
//         scenario.response
//       );
//     });
//   });
//   test("mock_chat_completion", () => {
//     const mocker = jest.fn();
//     const request = {
//       param: scenarios[0],
//     };

//     mocker.mockReturnValue(request);

//     const mockChatCompletion =
//       require("./your-module-name").mock_chat_completion;
//     mockChatCompletion(mocker, request);

//     expect(ChatCompletion.create).toHaveBeenCalledWith(request.param.response);
//   });
// });
// describe("set_temporary_env_vars", () => {
//   const envVarsToSet = ["OPENAI_API_KEY"];
//   let originalEnvValues = {};
//   beforeAll(() => {
//     envVarsToSet.forEach((envVar) => {
//       originalEnvValues[envVar] = process.env[envVar];
//     });
//   });
//   beforeEach(() => {
//     envVarsToSet.forEach((envVar) => {
//       process.env[envVar] = "fakekey";
//     });
//   });
//   afterEach(() => {
//     envVarsToSet.forEach((envVar) => {
//       const originalValue = originalEnvValues[envVar];
//       if (originalValue !== undefined) {
//         process.env[envVar] = originalValue;
//       } else {
//         delete process.env[envVar];
//       }
//     });
//   });
//   test("set_temporary_env_vars", () => {
//     // Test logic here
//   });
// });
