import { AIConfigRuntime } from "../lib/config";
import path from "path";
import { Prompt } from "../types";

const originalProcessEnv = { ...process.env };

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  process.env = originalProcessEnv;
});

describe("Loading an AIConfig", () => {
  test("loading a basic chatgpt query config", async () => {
    const filePath = path.join(
      __dirname,
      "samples",
      "basic_chatgpt_query_config.json"
    );

    const aiConfig = AIConfigRuntime.load(filePath);

    const completionParams = await aiConfig.resolve("prompt1");

    expect(completionParams).toEqual({
      model: "gpt-3.5-turbo",
      top_p: 1,
      temperature: 1,
      messages: [
        { content: "Hi! Tell me 10 cool things to do in NYC.", role: "user" },
      ],
    });
  });

  test("loading a prompt chain", async () => {
    const filePath = path.join(__dirname, "samples", "chained_gpt_config.json");

    const aiConfig = AIConfigRuntime.load(filePath);

    const completionParams1 = await aiConfig.resolve("prompt1");

    expect(completionParams1).toEqual({
      model: "gpt-3.5-turbo",
      top_p: 1,
      temperature: 1,
      max_tokens: 3000,
      messages: [
        {
          content:
            "I need to create a JSON representation of a list of products for our e-commerce website. Please provide the JSON structure with placeholders for product details. Product names: iPhone, MacBook, iPad",
          role: "user",
        },
      ],
    });

    const completionParams2 = await aiConfig.resolve("prompt2", {
      products: "MacBook, Apple Watch",
    });
    expect(completionParams2).toEqual({
      model: "gpt-3.5-turbo",
      top_p: 1,
      temperature: 1,
      max_tokens: 3000,
      messages: [
        {
          content:
            "I need to create a JSON representation of a list of products for our e-commerce website. Please provide the JSON structure with placeholders for product details. Product names: MacBook, Apple Watch",
          role: "user",
        },
        {
          content:
            "Now, fill in the placeholders with the details of three products, including their names, prices, and descriptions.",
          role: "user",
        },
      ],
    });

    // This one has remember_chat_context set to false, so none of the previous messages should get included
    const completionParams3 = await aiConfig.resolve("prompt3", {
      products: "MacBook, Apple Watch",
    });
    expect(completionParams3).toEqual({
      model: "gpt-3.5-turbo",
      top_p: 1,
      temperature: 1,
      max_tokens: 3000,
      messages: [
        {
          content:
            "Let's talk about something completely irrelevant to the previous discussion.",
          role: "user",
        },
      ],
    });
  });

  test("deserialize and re-serialize a prompt chain", async () => {
    const filePath = path.join(__dirname, "samples", "chained_gpt_config.json");

    const aiConfig = AIConfigRuntime.load(filePath);

    const completionParams = await aiConfig.resolve("prompt2", {
      products: "MacBook, Apple Watch",
    });
    expect(completionParams).toEqual({
      model: "gpt-3.5-turbo",
      top_p: 1,
      temperature: 1,
      max_tokens: 3000,
      messages: [
        {
          content:
            "I need to create a JSON representation of a list of products for our e-commerce website. Please provide the JSON structure with placeholders for product details. Product names: MacBook, Apple Watch",
          role: "user",
        },
        {
          content:
            "Now, fill in the placeholders with the details of three products, including their names, prices, and descriptions.",
          role: "user",
        },
      ],
    });

    const serializeResult = await aiConfig.serialize(
      "gpt-3.5-turbo",
      completionParams,
      {
        products: "Thunderbolt",
      }
    );

    expect(Array.isArray(serializeResult)).toBe(true);

    const prompts: Prompt[] = serializeResult as Prompt[];

    expect(prompts.length).toBe(2);

    const prompt1 = prompts[0];
    expect(prompt1.input).toEqual({
      content:
        "I need to create a JSON representation of a list of products for our e-commerce website. Please provide the JSON structure with placeholders for product details. Product names: MacBook, Apple Watch",
      role: "user",
    });
    expect(prompt1.metadata.model).toBe("gpt-3.5-turbo");
    expect(prompt1.metadata.parameters).toEqual({ products: "Thunderbolt" });

    const prompt2 = prompts[1];
    expect(prompt2.input).toEqual({
      content:
        "Now, fill in the placeholders with the details of three products, including their names, prices, and descriptions.",
      role: "user",
    });
    expect(prompt2.metadata.model).toBe("gpt-3.5-turbo");
    expect(prompt2.metadata.parameters).toEqual({ products: "Thunderbolt" });
  });

  test("serialize a prompt chain with different settings", async () => {
    const filePath = path.join(__dirname, "samples", "chained_gpt_config.json");

    const aiConfig = AIConfigRuntime.load(filePath);

    const completionParams = {
      model: "gpt-3.5-turbo",
      top_p: 1,
      temperature: 0.75, // Different from aiConfig.metadata.models["gpt-3.5-turbo"].temperature (which is 1)
      max_tokens: 3250, // Different from aiConfig.metadata.models["gpt-3.5-turbo"].max_tokens (which is 3000)
      messages: [
        {
          content:
            "I need to create a JSON representation of a list of products for our e-commerce website. Please provide the JSON structure with placeholders for product details. Product names: MacBook, Apple Watch",
          role: "user",
        },
        {
          content:
            "Now, fill in the placeholders with the details of three products, including their names, prices, and descriptions.",
          role: "user",
        },
      ],
    };

    const serializeResult = await aiConfig.serialize(
      "gpt-3.5-turbo",
      completionParams,
      {
        products: "Thunderbolt",
      }
    );

    expect(Array.isArray(serializeResult)).toBe(true);

    const prompts: Prompt[] = serializeResult as Prompt[];

    expect(prompts.length).toBe(2);

    const prompt1 = prompts[0];
    expect(prompt1.input).toEqual({
      content:
        "I need to create a JSON representation of a list of products for our e-commerce website. Please provide the JSON structure with placeholders for product details. Product names: MacBook, Apple Watch",
      role: "user",
    });
    // Prompt Model metadata should override just the differences from the global model metadata
    expect(prompt1.metadata.model).toEqual({
      name: "gpt-3.5-turbo",
      settings: { temperature: 0.75, max_tokens: 3250 },
    });
    expect(prompt1.metadata.parameters).toEqual({ products: "Thunderbolt" });

    const prompt2 = prompts[1];
    expect(prompt2.input).toEqual({
      content:
        "Now, fill in the placeholders with the details of three products, including their names, prices, and descriptions.",
      role: "user",
    });
    expect(prompt1.metadata.model).toEqual({
      name: "gpt-3.5-turbo",
      settings: { temperature: 0.75, max_tokens: 3250 },
    });
    expect(prompt2.metadata.parameters).toEqual({ products: "Thunderbolt" });
  });
});

describe("AIConfig CRUD operations", () => {});
