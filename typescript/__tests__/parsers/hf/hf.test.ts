import {
  HfInference,
  Options,
  TextGenerationArgs,
  TextGenerationOutput,
  TextGenerationStreamOutput,
} from "@huggingface/inference";
import { AIConfigRuntime } from "../../../lib/config";
import path from "path";
import { HuggingFaceTextGenerationParser } from "../../../lib/parsers/hf";
import { Prompt } from "../../../types";
import { getAPIKeyFromEnv } from "../../../lib/utils";
import { CallbackManager } from "../../../lib/callback";

const HF_CONFIG_PATH = path.join(__dirname, "hf-test-config.json");

async function mockTextGenerationImpl(
  _args: Omit<TextGenerationArgs, "accessToken">,
  _options?: Options
): Promise<TextGenerationOutput> {
  return {
    generated_text: "Test text generation",
  };
}

async function* mockTextGenerationStreamImpl(
  _args: Omit<TextGenerationArgs, "accessToken">,
  _options?: Options
): AsyncGenerator<TextGenerationStreamOutput> {
  yield {
    token: {
      id: 1,
      text: "Test",
      logprob: 0,
      special: false,
    },
    generated_text: null,
    details: null,
  };
  yield {
    token: {
      id: 2,
      text: " text",
      logprob: 0,
      special: false,
    },
    generated_text: null,
    details: null,
  };
  yield {
    token: {
      id: 3,
      text: " generation",
      logprob: 0,
      special: false,
    },
    generated_text: null,
    details: null,
  };
  yield {
    token: {
      id: 4,
      text: " stream",
      logprob: 0,
      special: false,
    },
    generated_text: "Test text generation stream",
    details: null,
  };
}

const mockTextGeneration = jest.fn().mockImplementation(mockTextGenerationImpl);
const mockTextGenerationStream = jest
  .fn()
  .mockImplementation(mockTextGenerationStreamImpl);

jest.mock("@huggingface/inference", () => {
  const originalModule = jest.requireActual("@huggingface/inference");

  return {
    ...originalModule,
    HfInference: jest.fn().mockImplementation(() => ({
      textGeneration: mockTextGeneration,
      textGenerationStream: mockTextGenerationStream,
    })),
  };
});

const mockedHfInference = HfInference as jest.MockedClass<typeof HfInference>;
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

describe("HuggingFaceTextGeneration ModelParser", () => {
  beforeEach(() => {
    mockedHfInference.mockClear();
    mockGetApiKeyFromEnv.mockClear();
  });

  test("uses HuggingFace API token from environment variable if it exists", async () => {
    mockGetApiKeyFromEnv.mockReturnValue("test-api-key");
    const aiConfig = AIConfigRuntime.load(HF_CONFIG_PATH);
    await aiConfig.run("prompt1");
    expect(mockedHfInference).toHaveBeenCalledWith("test-api-key");
  });

  test("serializing params to config prompt", () => {
    const aiConfig = AIConfigRuntime.load(HF_CONFIG_PATH);
    const parser = new HuggingFaceTextGenerationParser();

    const completionParams: TextGenerationArgs = {
      model: "mistralai/Mistral-7B-v0.1",
      // Note: top_p matches global config settings for the model and temperature is different
      parameters: {
        top_p: 0.9,
        temperature: 0.8,
      },
      inputs: "What are 5 interesting things to do in Toronto?",
    };

    const prompts = parser.serialize(
      "interestingThingsToronto",
      completionParams,
      aiConfig
    ) as Prompt[];

    expect(prompts).toHaveLength(1);
    const prompt = prompts[0];

    expect(prompt.name).toEqual("interestingThingsToronto");
    expect(prompt.input).toEqual(
      "What are 5 interesting things to do in Toronto?"
    );
    expect(prompt.metadata?.model).toEqual({
      name: "mistralai/Mistral-7B-v0.1",
      settings: {
        temperature: 0.8,
      },
    });
  });

  test("serialize callbacks", () => {
    const aiConfig = AIConfigRuntime.load(HF_CONFIG_PATH);
    const parser = new HuggingFaceTextGenerationParser();

    const completionParams: TextGenerationArgs = {
      model: "mistralai/Mistral-7B-v0.1",
      // Note: top_p matches global config settings for the model and temperature is different
      parameters: {
        top_p: 0.9,
        temperature: 0.8,
      },
      inputs: "What are 5 interesting things to do in Toronto?",
    };

    const callback = jest.fn().mockReturnValue(Promise.resolve(undefined));
    const callbackManager = new CallbackManager([callback]);
    aiConfig.setCallbackManager(callbackManager);

    const prompts = parser.serialize(
      "interestingThingsToronto",
      completionParams,
      aiConfig
    ) as Prompt[];

    const onStartEvent = callback.mock.calls[0][0];
    expect(onStartEvent.name).toEqual("on_serialize_start");
    expect(onStartEvent.file).toContain("hf.ts");
    expect(onStartEvent.data).toEqual({
      promptName: "interestingThingsToronto",
      data: completionParams,
    });

    const onEndEvent = callback.mock.calls[1][0];
    expect(onEndEvent.name).toEqual("on_serialize_end");
    expect(onEndEvent.file).toContain("hf.ts");
    expect(onEndEvent.data).toEqual({ result: prompts });
  });

  test("deserializing config prompt to params", () => {
    const aiConfig = AIConfigRuntime.load(HF_CONFIG_PATH);
    const parser = new HuggingFaceTextGenerationParser();

    const prompt1CompletionParams = parser.deserialize(
      aiConfig.getPrompt("prompt1")!,
      aiConfig
    );
    expect(prompt1CompletionParams).toEqual({
      model: "mistralai/Mistral-7B-v0.1",
      parameters: {
        top_p: 0.9,
        temperature: 0.9,
      },
      inputs: "What are 5 interesting things to do in NYC?",
    });

    const prompt2CompletionParams = parser.deserialize(
      aiConfig.getPrompt("prompt2")!,
      aiConfig
    );
    expect(prompt2CompletionParams).toEqual({
      model: "mistralai/Mistral-7B-v0.1",
      parameters: {
        top_p: 0.7,
        temperature: 0.9,
      },
      inputs: "What are 5 interesting things to do in Rome?",
    });
  });

  test("deserialize callbacks", () => {
    const aiConfig = AIConfigRuntime.load(HF_CONFIG_PATH);
    const parser = new HuggingFaceTextGenerationParser();

    const callback = jest.fn().mockReturnValue(Promise.resolve(undefined));
    const callbackManager = new CallbackManager([callback]);
    aiConfig.setCallbackManager(callbackManager);

    const prompt = aiConfig.getPrompt("prompt2")!;
    const prompt2CompletionParams = parser.deserialize(prompt, aiConfig);

    const onStartEvent = callback.mock.calls[0][0];
    expect(onStartEvent.name).toEqual("on_deserialize_start");
    expect(onStartEvent.file).toContain("hf.ts");
    expect(onStartEvent.data).toEqual({
      prompt: prompt,
    });

    const onEndEvent = callback.mock.calls[1][0];
    expect(onEndEvent.name).toEqual("on_deserialize_end");
    expect(onEndEvent.file).toContain("hf.ts");
    expect(onEndEvent.data).toEqual({ result: prompt2CompletionParams });
  });

  test("run prompt, non-streaming", async () => {
    const aiConfig = AIConfigRuntime.load(HF_CONFIG_PATH);

    // Parameters from config
    const outputWithConfigParam = await aiConfig.run("promptWithParams");
    expect(mockTextGeneration).toHaveBeenCalledWith({
      model: "mistralai/Mistral-7B-v0.1",
      inputs: "What are 5 interesting things to do in London?",
      parameters: {
        top_p: 0.9,
        temperature: 0.9,
        do_sample: false,
      },
    });

    const expectedOutput = {
      output_type: "execute_result",
      data: {
        kind: "string",
        value: "Test text generation",
      },
      execution_count: 0,
      metadata: {
        rawResponse: {
          generated_text: "Test text generation",
        },
      },
    };

    expect(outputWithConfigParam).toEqual([expectedOutput]);

    expect(aiConfig.getPrompt("promptWithParams")?.outputs?.length).toEqual(1);
    expect(aiConfig.getPrompt("promptWithParams")?.outputs).toEqual([
      expectedOutput,
    ]);
    expect(aiConfig.getOutputText("promptWithParams")).toEqual(
      "Test text generation"
    );

    // Parameters from run call
    const outputWithRunParam = await aiConfig.run("promptWithParams", {
      city: "San Francisco",
    });
    expect(mockTextGeneration).toHaveBeenCalledWith({
      model: "mistralai/Mistral-7B-v0.1",
      inputs: "What are 5 interesting things to do in San Francisco?",
      parameters: {
        top_p: 0.9,
        temperature: 0.9,
        do_sample: false,
      },
    });

    expect(outputWithRunParam).toEqual([expectedOutput]);

    expect(aiConfig.getPrompt("promptWithParams")?.outputs?.length).toEqual(1);
    expect(aiConfig.getPrompt("promptWithParams")?.outputs).toEqual([
      expectedOutput,
    ]);
    expect(aiConfig.getOutputText("promptWithParams")).toEqual(
      "Test text generation"
    );
  });

  test("run prompt, streaming", async () => {
    const aiConfig = AIConfigRuntime.load(HF_CONFIG_PATH);
    const streamCallback = jest.fn();

    // Parameters from config
    await aiConfig.run("promptWithParams", undefined, {
      streaming: true,
      callbacks: { streamCallback },
    });
    expect(mockTextGenerationStream).toHaveBeenCalledWith({
      model: "mistralai/Mistral-7B-v0.1",
      inputs: "What are 5 interesting things to do in London?",
      parameters: {
        top_p: 0.9,
        temperature: 0.9,
        do_sample: false,
      },
    });

    expect(streamCallback.mock.calls).toEqual([
      ["Test", "Test", 0],
      [" text", "Test text", 0],
      [" generation", "Test text generation", 0],
      [" stream", "Test text generation stream", 0],
    ]);

    streamCallback.mockClear();

    // Parameters from run call
    await aiConfig.run(
      "promptWithParams",
      { city: "San Francisco" },
      {
        streaming: true,
        callbacks: { streamCallback },
      }
    );
    expect(mockTextGeneration).toHaveBeenCalledWith({
      model: "mistralai/Mistral-7B-v0.1",
      inputs: "What are 5 interesting things to do in San Francisco?",
      parameters: {
        top_p: 0.9,
        temperature: 0.9,
        do_sample: false,
      },
    });

    expect(streamCallback.mock.calls).toEqual([
      ["Test", "Test", 0],
      [" text", "Test text", 0],
      [" generation", "Test text generation", 0],
      [" stream", "Test text generation stream", 0],
    ]);
  });

  test("run callbacks", async () => {
    const aiConfig = AIConfigRuntime.load(HF_CONFIG_PATH);
    const parser = new HuggingFaceTextGenerationParser();
    AIConfigRuntime.registerModelParser(parser, ["mistralai/Mistral-7B-v0.1"]);

    const callback = jest.fn().mockReturnValue(Promise.resolve(undefined));
    const callbackManager = new CallbackManager([callback]);
    aiConfig.setCallbackManager(callbackManager);

    const prompt = aiConfig.getPrompt("promptWithParams")!;
    const outputWithRunParam = await parser.run(prompt, aiConfig, undefined, {
      city: "San Francisco",
    });

    const onStartEvent = callback.mock.calls[0][0];
    expect(onStartEvent.name).toEqual("on_run_start");
    expect(onStartEvent.file).toContain("hf.ts");
    expect(onStartEvent.data).toEqual({
      prompt: prompt,
      params: { city: "San Francisco" },
    });

    const deserializeStartEvent = callback.mock.calls[1][0];
    expect(deserializeStartEvent.data).toEqual({
      prompt: prompt,
      params: { city: "San Francisco" },
    });

    // deserializeEndEvent is callback.mock.calls[2][0]. No need to test
    // since it's already tested in the deserialization tests; it's enough
    // to know that the start event is called correctly

    const onEndEvent = callback.mock.calls[3][0];
    expect(onEndEvent.name).toEqual("on_run_end");
    expect(onEndEvent.file).toContain("hf.ts");
    expect(onEndEvent.data).toEqual({ result: outputWithRunParam });
  });
});
