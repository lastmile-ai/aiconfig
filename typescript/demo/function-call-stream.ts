#!/usr/bin/env -S npm run tsn -T

import util from "util";
import OpenAI from "openai";
import {
  ChatCompletionMessage,
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  ChatCompletionCreateParams,
} from "openai/resources/chat";
import * as path from "path";
import { AIConfigRuntime } from "../lib/config";
import { Prompt } from "../types";
import { uniqueId } from "lodash";

// This example is taken from https://github.com/openai/openai-node/blob/v4/examples/function-call-stream.ts
// and modified to show the same functionality using AIConfig.

// gets API Key from environment variable OPENAI_API_KEY
// process.env.OPENAI_API_KEY =

const functions: OpenAI.Chat.ChatCompletionCreateParams.Function[] = [
  {
    name: "list",
    description:
      "list queries books by genre, and returns a list of names of books",
    parameters: {
      type: "object",
      properties: {
        genre: {
          type: "string",
          enum: ["mystery", "nonfiction", "memoir", "romance", "historical"],
        },
      },
    },
  },
  {
    name: "search",
    description:
      "search queries books by their name and returns a list of book names and their ids",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    },
  },
  {
    name: "get",
    description:
      "get returns a book's detailed information based on the id of the book. Note that this does not accept names, and only IDs, which you can get by using search.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
    },
  },
];

async function callFunction(
  function_call: ChatCompletionMessage.FunctionCall
): Promise<any> {
  const args = JSON.parse(function_call.arguments!);
  switch (function_call.name) {
    case "list":
      return await list(args["genre"]);

    case "search":
      return await search(args["name"]);

    case "get":
      return await get(args["id"]);

    default:
      throw new Error("No function found");
  }
}

async function functionCallingWithoutAIConfig() {
  const openai = new OpenAI();

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "Please use our book database, which you can access using functions to answer the following questions.",
    },
    {
      role: "user",
      content:
        "I really enjoyed reading To Kill a Mockingbird, could you recommend me a book that is similar and tell me why?",
    },
  ];
  console.log(messages[0]);
  console.log(messages[1]);
  console.log();

  while (true) {
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      functions: functions,
      stream: true,
    });

    // Since the stream returns chunks, we need to build up the ChatCompletionMessage object.
    // We implement this logic in messageReducer, which coalesces deltas into the message.
    // `lineRewriter()` allows us to rewrite the last output with new text, which is one
    // way of forwarding the streamed output to a visual interface.
    let writeLine = lineRewriter();
    let message = {} as ChatCompletionMessage;
    for await (const chunk of stream) {
      message = messageReducer(message, chunk);
      writeLine(message);
    }
    console.log();
    messages.push(message);

    // If there is no function call, we're done and can exit this loop
    if (!message.function_call) {
      return;
    }

    // If there is a function call, we generate a new message with the role 'function'.
    const result = await callFunction(message.function_call);
    const newMessage = {
      role: "function" as const,
      name: message.function_call.name!,
      content: JSON.stringify(result),
    };
    messages.push(newMessage);

    console.log(newMessage);
    console.log();
  }
}

function messageReducer(
  previous: ChatCompletionMessage,
  item: ChatCompletionChunk
): ChatCompletionMessage {
  const reduce = (acc: any, delta: any) => {
    acc = { ...acc };
    for (const [key, value] of Object.entries(delta)) {
      if (acc[key] === undefined || acc[key] === null) {
        acc[key] = value;
      } else if (typeof acc[key] === "string" && typeof value === "string") {
        (acc[key] as string) += value;
      } else if (typeof acc[key] === "object" && !Array.isArray(acc[key])) {
        acc[key] = reduce(acc[key], value);
      }
    }
    return acc;
  };

  return reduce(previous, item.choices[0]!.delta) as ChatCompletionMessage;
}

async function functionCallingWithAIConfig() {
  const aiConfig = AIConfigRuntime.load(
    path.join(__dirname, "function-call.aiconfig.json")
  );

  const params = {
    book: "Where the Crawdads Sing",
  };

  // TODO: saqadri - figure out how to make typings cleaner
  const completionParams = (await aiConfig.resolve(
    "recommendBook",
    params
  )) as unknown as ChatCompletionCreateParams;

  // {"model":"gpt-4-0613","messages":[{"content":"Say this is a Demo test","role":"user"},{"role":"assistant","content":"This is a test."}]}
  console.log("completionParams=", JSON.stringify(completionParams));

  const messages = completionParams.messages;
  console.log(messages[0]);
  console.log(messages[1]);
  console.log();

  let promptToRun = "recommendBook";

  while (true) {
    let modelOutput = await aiConfig.run(promptToRun, params, {
      callbacks: {
        streamCallback: (
          data: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta,
          _accumulatedData: any,
          _index: any
        ) => {
          let text;
          if (data?.content) {
            text = data.content;
          } else if (data?.function_call) {
            if (data.function_call.name) {
              text = `${data.function_call.name}(`;
            } else if (data.function_call.arguments) {
              text = data.function_call.arguments;
            } else {
              text = `)`;
            }
          } else {
            text = "\n";
          }
          process.stdout.write(text);
        },
      },
    });

    const output = Array.isArray(modelOutput) ? modelOutput[0] : modelOutput;
    if (output.output_type === "error") {
      console.error(
        `Error during inference: ${output.ename}: ${output.evalue}`
      );
      return;
    }

    const rawResponse = output.metadata?.rawResponse;
    const function_call = rawResponse?.function_call;
    console.log("function_call=", function_call);

    // If there is no function call, we're done and can exit this loop
    if (!function_call) {
      return;
    }

    // If there is a function call, we generate a new message with the role 'function'.
    const result = await callFunction(function_call);
    const newMessage = {
      role: "function" as const,
      name: function_call.name!,
      content: JSON.stringify(result),
    };

    promptToRun = `functionCallResult-${uniqueId()}`;

    // TODO: saqadri - simplify adding a new prompt
    const existingPrompt = aiConfig.getPrompt("recommendBook")!;
    const newPrompt: Prompt = {
      ...existingPrompt,
      name: promptToRun,
      input: newMessage,
      outputs: undefined,
    };

    aiConfig.addPrompt(newPrompt);

    console.log(newMessage);
    console.log();
  }
}

async function createAIConfig() {
  const model = "gpt-3.5-turbo";
  const data = {
    model,
    messages: [
      {
        role: "system",
        content:
          "Please use our book database, which you can access using functions to answer the following questions.",
      },
      {
        role: "user",
        content:
          "I really enjoyed reading To Kill a Mockingbird, could you recommend me a book that is similar and tell me why?",
      },
    ],
    functions,
  };

  const aiConfig = AIConfigRuntime.create(
    "function-call-demo",
    "this is a demo AIConfig to show function calling using OpenAI"
  );
  const result = await aiConfig.serialize(model, data, "functionCallResult");

  if (Array.isArray(result)) {
    for (const prompt of result) {
      aiConfig.addPrompt(prompt);
    }
  } else {
    aiConfig.addPrompt(result);
  }

  aiConfig.save("demo/function-call.aiconfig.json", {
    serializeOutputs: true,
  });
}

function lineRewriter() {
  let lastMessageLength = 0;
  return function write(value: any) {
    process.stdout.cursorTo(0);
    process.stdout.moveCursor(
      0,
      -Math.floor((lastMessageLength - 1) / process.stdout.columns)
    );
    lastMessageLength = util.formatWithOptions(
      { colors: false, breakLength: Infinity },
      value
    ).length;
    process.stdout.write(
      util.formatWithOptions({ colors: true, breakLength: Infinity }, value)
    );
  };
}

const db = [
  {
    id: "a1",
    name: "To Kill a Mockingbird",
    genre: "historical",
    description: `Compassionate, dramatic, and deeply moving, "To Kill A Mockingbird" takes readers to the roots of human behavior - to innocence and experience, kindness and cruelty, love and hatred, humor and pathos. Now with over 18 million copies in print and translated into forty languages, this regional story by a young Alabama woman claims universal appeal. Harper Lee always considered her book to be a simple love story. Today it is regarded as a masterpiece of American literature.`,
  },
  {
    id: "a2",
    name: "All the Light We Cannot See",
    genre: "historical",
    description: `In a mining town in Germany, Werner Pfennig, an orphan, grows up with his younger sister, enchanted by a crude radio they find that brings them news and stories from places they have never seen or imagined. Werner becomes an expert at building and fixing these crucial new instruments and is enlisted to use his talent to track down the resistance. Deftly interweaving the lives of Marie-Laure and Werner, Doerr illuminates the ways, against all odds, people try to be good to one another.`,
  },
  {
    id: "a3",
    name: "Where the Crawdads Sing",
    genre: "historical",
    description: `For years, rumors of the “Marsh Girl” haunted Barkley Cove, a quiet fishing village. Kya Clark is barefoot and wild; unfit for polite society. So in late 1969, when the popular Chase Andrews is found dead, locals immediately suspect her.

But Kya is not what they say. A born naturalist with just one day of school, she takes life's lessons from the land, learning the real ways of the world from the dishonest signals of fireflies. But while she has the skills to live in solitude forever, the time comes when she yearns to be touched and loved. Drawn to two young men from town, who are each intrigued by her wild beauty, Kya opens herself to a new and startling world—until the unthinkable happens.`,
  },
];

async function list(genre: string) {
  return db
    .filter((item) => item.genre === genre)
    .map((item) => ({ name: item.name, id: item.id }));
}

async function search(name: string) {
  return db
    .filter((item) => item.name.includes(name))
    .map((item) => ({ name: item.name, id: item.id }));
}

async function get(id: string) {
  return db.find((item) => item.id === id)!;
}

// Uncomment this to use OpenAI directly (without AIConfig)
// functionCallingWithoutAIConfig();

// Uncomment this to use OpenAI with AIConfig -- observe the difference in usage (it should be simpler)
functionCallingWithAIConfig();

// Uncomment this to create an AIConfig programmatically
// createAIConfig();
